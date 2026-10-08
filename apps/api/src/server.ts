import { env } from './config/env';
import { createContainer } from './container';
import { createApp } from './app';

async function bootstrap() {
  console.log('🚀 Initializing ASCEND CA Community API...');

  const container = createContainer();
  const app = createApp(container);

  const server = app.listen(env.PORT, () => {
    console.log(`✅ ASCEND API running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
    console.log(`📖 OpenAPI Docs available at http://localhost:${env.PORT}/api-docs`);
    if (env.ADMIN_API_ENABLED) {
      console.log(`🔒 Admin API Router mounted at /admin-api (Admin Subdomain Isolation ON)`);
    } else {
      console.log(`ℹ️ Admin API Router is DISABLED`);
    }
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down API server...');
    server.close(async () => {
      await container.prisma.$disconnect();
      console.log('💤 Disconnected Prisma client. Goodbye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
