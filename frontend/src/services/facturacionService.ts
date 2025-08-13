// Servicio para integración con proveedor de facturación

export interface FacturacionConfig {
  portalUrl: string;
  apiKey: string;
  clientId: string;
  webhookUrl: string;
}

export interface FacturaData {
  pacienteId: string;
  pacienteNombre: string;
  pacienteRfc?: string;
  monto: number;
  concepto: string;
  fecha: string;
  metodoPago?: string;
}

class FacturacionService {
  private config: FacturacionConfig;

  constructor() {
    this.config = {
      portalUrl: import.meta.env.VITE_FACTURACION_URL || 'https://portal-facturacion.ejemplo.com',
      apiKey: import.meta.env.VITE_FACTURACION_API_KEY || '',
      clientId: import.meta.env.VITE_FACTURACION_CLIENT_ID || 'procura_clinic',
      webhookUrl: import.meta.env.VITE_FACTURACION_WEBHOOK_URL || ''
    };
  }

  /**
   * Abre el portal de facturación en una nueva ventana
   */
  openPortal(): void {
    window.open(this.config.portalUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Abre el portal con datos específicos de facturación
   */
  openPortalWithData(facturaData: FacturaData): void {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      paciente_id: facturaData.pacienteId,
      paciente_nombre: facturaData.pacienteNombre,
      monto: facturaData.monto.toString(),
      concepto: facturaData.concepto,
      fecha: facturaData.fecha,
      ...(facturaData.pacienteRfc && { paciente_rfc: facturaData.pacienteRfc }),
      ...(facturaData.metodoPago && { metodo_pago: facturaData.metodoPago })
    });

    const url = `${this.config.portalUrl}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Verifica si la configuración está completa
   */
  isConfigured(): boolean {
    return !!(this.config.portalUrl && this.config.apiKey);
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): FacturacionConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<FacturacionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Genera un token de autenticación para el portal
   */
  async generateAuthToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/facturacion/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          client_id: this.config.clientId
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error generando token de autenticación:', error);
      return null;
    }
  }

  /**
   * Sincroniza datos con el portal de facturación
   */
  async syncData(): Promise<boolean> {
    try {
      const token = await this.generateAuthToken();
      if (!token) return false;

      const response = await fetch('/api/facturacion/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
export const facturacionService = new FacturacionService();
export default facturacionService; 