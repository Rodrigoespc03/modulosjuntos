# 🐳 DOCKERFILE - SISTEMA PROCURA BACKEND
# Multi-stage build para optimizar tamaño y seguridad

# ========================================
# STAGE 1: DEPENDENCIAS Y BUILD
# ========================================
FROM node:18-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Generar Prisma client
RUN npx prisma generate

# ========================================
# STAGE 2: PRODUCCIÓN
# ========================================
FROM node:18-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S procura -u 1001

# Instalar dependencias de producción
RUN apk add --no-cache \
    dumb-init \
    curl

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias del builder
COPY --from=builder --chown=procura:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=procura:nodejs /app/package*.json ./

# Copiar código de la aplicación
COPY --chown=procura:nodejs . .

# Copiar Prisma client generado
COPY --from=builder --chown=procura:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Crear directorios necesarios
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R procura:nodejs /app

# Cambiar al usuario no-root
USER procura

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]



