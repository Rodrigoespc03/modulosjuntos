import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedRequest extends Request {
  user?: any;
  organizacion?: any;
  tenantFilter?: any;
}

@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Obtener el token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token de autenticación requerido');
      }

      const token = authHeader.substring(7);
      
      // Verificar y decodificar el token
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_2024',
      }) as any;

      // Buscar el usuario en la base de datos
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        include: { sede: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

                    // Buscar la organización del usuario
              const organizacion = await this.prisma.$queryRaw`
                SELECT o.* FROM organizaciones o
                INNER JOIN usuario u ON u.organizacion_id = o.id
                WHERE u.id = ${user.id}
              ` as any[];

              // Establecer el filtro de tenant
              const tenantFilter = {
                organizacion_id: organizacion?.[0]?.id || null,
              };

              // Agregar información al request
              req.user = user;
              req.organizacion = organizacion?.[0] || null;
      req.tenantFilter = tenantFilter;

      next();
    } catch (error) {
      console.error('Error en MultiTenantMiddleware:', error);
      throw new UnauthorizedException('Error de autenticación multi-tenant');
    }
  }
} 