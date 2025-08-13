import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MultiTenantMiddleware } from './auth/multi-tenant.middleware';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_2024',
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
    InventoryModule,
    DashboardModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MultiTenantMiddleware)
      .forRoutes(
        'api/products',
        'api/movements',
        'api/inventory-usage',
        'api/sedes',
        'api/users',
        'api/suppliers',
        'api/allergens',
        'api/stock',
        'api/dashboard',
      );
  }
} 