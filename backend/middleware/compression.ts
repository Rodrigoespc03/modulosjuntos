import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

export interface CompressionOptions {
  threshold?: number; // Tamaño mínimo para comprimir (bytes)
  level?: number; // Nivel de compresión (1-9)
  algorithms?: ('gzip' | 'deflate' | 'brotli')[];
  exclude?: string[]; // Content-Types a excluir
  include?: string[]; // Content-Types a incluir
}

export class CompressionMiddleware {
  private options: Required<CompressionOptions>;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      threshold: options.threshold || 1024, // 1KB mínimo
      level: options.level || 6, // Nivel medio de compresión
      algorithms: options.algorithms || ['gzip', 'deflate', 'brotli'],
      exclude: options.exclude || ['image/', 'video/', 'audio/', 'application/zip', 'application/pdf'],
      include: options.include || ['text/', 'application/json', 'application/xml', 'application/javascript']
    };
  }

  // Middleware principal de compresión
  compress() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      
      // Verificar si la respuesta debe ser comprimida
      if (!this.shouldCompress(req, res)) {
        return next();
      }

      // Interceptar el método send original
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      // Comprimir respuesta JSON
      res.json = async function(data: any) {
        const jsonString = JSON.stringify(data);
        const compressed = await this.compressResponse(jsonString, req);
        
        if (compressed) {
          res.set('Content-Encoding', compressed.algorithm);
          res.set('Content-Length', compressed.length.toString());
          res.set('Vary', 'Accept-Encoding');
          return originalEnd.call(this, compressed.data);
        }
        
        return originalJson.call(this, data);
      }.bind(this);

      // Comprimir respuesta de texto
      res.send = async function(data: any) {
        if (typeof data === 'string') {
          const compressed = await this.compressResponse(data, req);
          
          if (compressed) {
            res.set('Content-Encoding', compressed.algorithm);
            res.set('Content-Length', compressed.length.toString());
            res.set('Vary', 'Accept-Encoding');
            return originalEnd.call(this, compressed.data);
          }
        }
        
        return originalSend.call(this, data);
      }.bind(this);

      // Comprimir respuesta binaria
      res.end = async function(data?: any) {
        if (data && typeof data === 'string') {
          const compressed = await this.compressResponse(data, req);
          
          if (compressed) {
            res.set('Content-Encoding', compressed.algorithm);
            res.set('Content-Length', compressed.length.toString());
            res.set('Vary', 'Accept-Encoding');
            return originalEnd.call(this, compressed.data);
          }
        }
        
        return originalEnd.call(this, data);
      }.bind(this);

      const endTime = performance.now();
      console.log(`🗜️ Compression middleware setup: ${(endTime - startTime).toFixed(2)}ms`);
      
      next();
    };
  }

  // Verificar si la respuesta debe ser comprimida
  private shouldCompress(req: Request, res: Response): boolean {
    // Verificar Accept-Encoding header
    const acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding) {
      return false;
    }

    // Verificar Content-Type
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType) {
      // Excluir tipos de contenido que no se benefician de la compresión
      if (this.options.exclude.some(exclude => contentType.includes(exclude))) {
        return false;
      }

      // Solo incluir tipos específicos si se especifican
      if (this.options.include.length > 0 && !this.options.include.some(include => contentType.includes(include))) {
        return false;
      }
    }

    return true;
  }

  // Comprimir respuesta usando el mejor algoritmo disponible
  private async compressResponse(data: string, req: Request): Promise<{ algorithm: string; data: Buffer; length: number } | null> {
    const acceptEncoding = req.headers['accept-encoding'] as string;
    const dataSize = Buffer.byteLength(data, 'utf8');

    // No comprimir si el tamaño es menor al threshold
    if (dataSize < this.options.threshold) {
      return null;
    }

    // Determinar el mejor algoritmo basado en Accept-Encoding
    const algorithm = this.selectBestAlgorithm(acceptEncoding);
    if (!algorithm) {
      return null;
    }

    try {
      let compressedData: Buffer;
      let algorithmName: string;

      switch (algorithm) {
        case 'brotli':
          // Node's BrotliOptions usa BROTLI_PARAM_*, evitamos pasar 'level' directo
          compressedData = await brotliCompress(data);
          algorithmName = 'br';
          break;
        case 'gzip':
          compressedData = await gzip(data, { level: this.options.level });
          algorithmName = 'gzip';
          break;
        case 'deflate':
          compressedData = await deflate(data, { level: this.options.level });
          algorithmName = 'deflate';
          break;
        default:
          return null;
      }

      // Solo usar compresión si realmente reduce el tamaño
      if (compressedData.length >= dataSize) {
        return null;
      }

      const compressionRatio = ((dataSize - compressedData.length) / dataSize * 100).toFixed(2);
      console.log(`🗜️ Compressed ${dataSize} bytes to ${compressedData.length} bytes (${compressionRatio}% reduction) using ${algorithmName}`);

      return {
        algorithm: algorithmName,
        data: compressedData,
        length: compressedData.length
      };

    } catch (error) {
      console.error('❌ Compression error:', error);
      return null;
    }
  }

  // Seleccionar el mejor algoritmo de compresión
  private selectBestAlgorithm(acceptEncoding: string): string | null {
    if (!acceptEncoding) {
      return null;
    }

    const encodings = acceptEncoding.toLowerCase().split(',').map(e => e.trim());
    
    // Prioridad: brotli > gzip > deflate
    for (const algorithm of this.options.algorithms) {
      if (encodings.includes(algorithm) || encodings.includes('*')) {
        return algorithm;
      }
    }

    return null;
  }

  // Middleware para comprimir archivos estáticos
  static compressStatic() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const path = req.path;
      
      // Solo comprimir archivos estáticos específicos
      const staticExtensions = ['.js', '.css', '.html', '.json', '.xml', '.txt'];
      const shouldCompress = staticExtensions.some(ext => path.endsWith(ext));
      
      if (shouldCompress) {
        const compression = new CompressionMiddleware({
          threshold: 512, // Threshold más bajo para archivos estáticos
          level: 9, // Máxima compresión para archivos estáticos
          algorithms: ['brotli', 'gzip']
        });
        
        return compression.compress()(req, res, next);
      }
      
      next();
    };
  }

  // Middleware para comprimir respuestas de API
  static compressAPI() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const compression = new CompressionMiddleware({
        threshold: 1024,
        level: 6,
        algorithms: ['gzip', 'deflate'],
        include: ['application/json', 'application/xml', 'text/']
      });
      
      return compression.compress()(req, res, next);
    };
  }

  // Método para obtener estadísticas de compresión
  static getCompressionStats(): any {
    return {
      enabled: true,
      algorithms: ['gzip', 'deflate', 'brotli'],
      defaultThreshold: 1024,
      defaultLevel: 6
    };
  }
}

// Instancia por defecto
export const compressionMiddleware = new CompressionMiddleware();

// Middleware de compresión por defecto
export const compress = compressionMiddleware.compress.bind(compressionMiddleware);

// Middleware específico para archivos estáticos
export const compressStatic = CompressionMiddleware.compressStatic;

// Middleware específico para API
export const compressAPI = CompressionMiddleware.compressAPI;



