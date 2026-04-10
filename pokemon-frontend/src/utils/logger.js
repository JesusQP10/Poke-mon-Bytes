/**
 * Sistema de logging estructurado
 * Permite diferentes niveles de log y formateo
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

class Logger {
  constructor() {
    // Nivel de log según entorno
    this.level = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    this.prefix = '[Pokemon Bytes]';
  }

  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
    } else {
      this.level = level;
    }
  }

  _shouldLog(level) {
    return level >= this.level;
  }

  _formatMessage(context, message, data) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const contextStr = context ? `[${context}]` : '';
    return {
      formatted: `${this.prefix}${contextStr} ${message}`,
      timestamp,
      context,
      message,
      data,
    };
  }

  debug(context, message, data) {
    if (!this._shouldLog(LOG_LEVELS.DEBUG)) return;
    const log = this._formatMessage(context, message, data);
    console.log(`🔍 ${log.formatted}`, data || '');
  }

  info(context, message, data) {
    if (!this._shouldLog(LOG_LEVELS.INFO)) return;
    const log = this._formatMessage(context, message, data);
    console.info(`ℹ️ ${log.formatted}`, data || '');
  }

  warn(context, message, data) {
    if (!this._shouldLog(LOG_LEVELS.WARN)) return;
    const log = this._formatMessage(context, message, data);
    console.warn(`⚠️ ${log.formatted}`, data || '');
  }

  error(context, message, error) {
    if (!this._shouldLog(LOG_LEVELS.ERROR)) return;
    const log = this._formatMessage(context, message, error);
    console.error(`❌ ${log.formatted}`, error || '');
    
    
    if (!import.meta.env.DEV) {
      this._sendToTelemetry(log);
    }
  }

  _sendToTelemetry(log) {
    // Implementar envío a servicio de telemetría (Sentry, LogRocket, etc.)
  
    try {
      const errors = JSON.parse(localStorage.getItem('pokemon_errors') || '[]');
      errors.push({
        ...log,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
      // Mantener solo los últimos 50 errores
      if (errors.length > 50) errors.shift();
      localStorage.setItem('pokemon_errors', JSON.stringify(errors));
    } catch (e) {
      // Silenciar errores de localStorage
    }
  }

  // Métodos para contextos específicos
  phaser(message, data) {
    this.debug('Phaser', message, data);
  }

  store(message, data) {
    this.debug('Store', message, data);
  }

  api(message, data) {
    this.info('API', message, data);
  }

  batalla(message, data) {
    this.debug('Batalla', message, data);
  }

  mapa(message, data) {
    this.debug('Mapa', message, data);
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar niveles para configuración
export { LOG_LEVELS };

// Helper para medir performance
export function medirTiempo(label) {
  const inicio = performance.now();
  return () => {
    const fin = performance.now();
    const duracion = (fin - inicio).toFixed(2);
    logger.debug('Performance', `${label}: ${duracion}ms`);
    return duracion;
  };
}

// Helper para logs de carga de assets
export function logCargaAsset(tipo, nombre, exito = true) {
  if (exito) {
    logger.debug('Assets', `✓ ${tipo} cargado: ${nombre}`);
  } else {
    logger.warn('Assets', `✗ Error cargando ${tipo}: ${nombre}`);
  }
}
