// 🚀 PM2 ECOSYSTEM CONFIG - SISTEMA PROCURA
// Configuración para escalabilidad horizontal con cluster mode

module.exports = {
  // ========================================
  // APLICACIÓN PRINCIPAL
  // ========================================
  apps: [
    {
      name: 'procura-backend',
      script: './dist/index.js',
      instances: 'max', // Usar todos los CPUs disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      },

      // ========================================
      // CONFIGURACIÓN DE CLUSTER
      // ========================================
      // Instancias específicas por ambiente
      instances: process.env.NODE_ENV === 'production' ? 'max' : 2,
      
      // Load balancing
      load_balancing_method: 'least-connection',
      
      // Auto-restart en caso de fallo
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // ========================================
      // MONITORING Y LOGGING
      // ========================================
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // ========================================
      // PERFORMANCE
      // ========================================
      // Memory management
      max_memory_restart: '1G',
      
      // Node.js optimizations
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
        '--gc-interval=100'
      ],
      
      // ========================================
      // SECURITY
      // ========================================
      // Kill timeout
      kill_timeout: 5000,
      
      // Graceful shutdown
      listen_timeout: 8000,
      
      // ========================================
      // HEALTH CHECKS
      // ========================================
      // Health check endpoint
      health_check_grace_period: 3000,
      
      // ========================================
      // ENVIRONMENT SPECIFIC
      // ========================================
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: 'postgresql://procura:procura_secure_password@localhost:5432/procura_dev',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'dev_jwt_secret_key',
        JWT_REFRESH_SECRET: 'dev_jwt_refresh_secret_key',
        ENCRYPTION_KEY: 'dev_encryption_key_32_chars_long'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        DATABASE_URL: 'postgresql://procura:procura_secure_password@postgres:5432/procura_staging',
        REDIS_URL: 'redis://redis:6379',
        JWT_SECRET: 'staging_jwt_secret_key',
        JWT_REFRESH_SECRET: 'staging_jwt_refresh_secret_key',
        ENCRYPTION_KEY: 'staging_encryption_key_32_chars'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://procura:procura_secure_password@postgres:5432/procura',
        REDIS_URL: 'redis://redis:6379',
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
      }
    },

    // ========================================
    // WORKER PARA TAREAS PESADAS
    // ========================================
    {
      name: 'procura-worker',
      script: './dist/src/workers/heavyTasks.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      
      // Configuración específica para workers
      max_memory_restart: '2G',
      autorestart: true,
      max_restarts: 5,
      
      // Logs separados para workers
      log_file: './logs/worker-combined.log',
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-error.log'
    },

    // ========================================
    // WORKER PARA EMAILS
    // ========================================
    {
      name: 'procura-email-worker',
      script: './dist/src/workers/emailQueue.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      
      // Configuración para emails
      max_memory_restart: '512M',
      autorestart: true,
      max_restarts: 3,
      
      // Logs para email worker
      log_file: './logs/email-worker-combined.log',
      out_file: './logs/email-worker-out.log',
      error_file: './logs/email-worker-error.log'
    },

    // ========================================
    // WORKER PARA WHATSAPP
    // ========================================
    {
      name: 'procura-whatsapp-worker',
      script: './dist/src/workers/whatsappQueue.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      
      // Configuración para WhatsApp
      max_memory_restart: '512M',
      autorestart: true,
      max_restarts: 3,
      
      // Logs para WhatsApp worker
      log_file: './logs/whatsapp-worker-combined.log',
      out_file: './logs/whatsapp-worker-out.log',
      error_file: './logs/whatsapp-worker-error.log'
    }
  ],

  // ========================================
  // CONFIGURACIÓN DE DEPLOYMENT
  // ========================================
  deploy: {
    production: {
      user: 'procura',
      host: 'production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/procura-backend.git',
      path: '/var/www/procura/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'procura',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:username/procura-backend.git',
      path: '/var/www/procura/staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};
