import pino from 'pino'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

// Configuração de logs estruturada
const loggerConfig = {
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  
  // Em desenvolvimento: logs bonitos e coloridos
  // Em produção: logs estruturados JSON
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
        singleLine: false,
      },
    },
  }),

  // Em produção: adicionar informações do sistema
  ...(!isDevelopment && {
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      service: 'erp-server',
      version: process.env.APP_VERSION || '1.0.0',
    },
  }),
}

export const logger = pino(loggerConfig)

// Logger customizado para diferentes contextos
export const createContextLogger = (context: string) => {
  return logger.child({ context })
}

// Logs específicos para diferentes módulos
export const authLogger = createContextLogger('auth')
export const dbLogger = createContextLogger('database')
export const apiLogger = createContextLogger('api')
export const errorLogger = createContextLogger('error')

// Helper para logs de performance
export const performanceLogger = {
  start: (operation: string) => {
    const start = Date.now()
    return {
      end: () => {
        const duration = Date.now() - start
        logger.info({ operation, duration }, `Operation completed in ${duration}ms`)
      }
    }
  }
}

export default logger