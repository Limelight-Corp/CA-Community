import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPIDocument } from '@ascend/shared';
import { env } from './config/env';
import { AppContainer } from './container';
import { standardRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';

export function createApp(container: AppContainer): Express {
  const app = express();

  // 1. Security Hardening
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS Allowlist
  const allowedOrigins = [env.WEB_ALLOWED_ORIGIN, env.ADMIN_ALLOWED_ORIGIN];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS origin denied'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // 3. Body Parsers & Global Rate Limiter
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(standardRateLimiter);

  // 4. OpenAPI / Swagger Documentation
  const openApiDoc = generateOpenAPIDocument();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
  app.get('/api-docs.json', (_req, res) => {
    res.json(openApiDoc);
  });

  // 5. Health Check & Readiness Probes
  app.get(['/health', '/healthz', '/readyz'], (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ASCEND CA Community API',
      adminApiEnabled: env.ADMIN_API_ENABLED,
    });
  });

  // 6. Public & Member API Routes
  app.use('/api/v1/auth', container.authRouter);
  app.use('/api/v1/content', container.contentRouter);
  app.use('/api/v1/events', container.eventsRouter);
  app.use('/api/v1/payments', container.paymentsRouter);
  app.use('/api/v1/resources', container.resourcesRouter);
  app.use('/api/v1/members', container.membersRouter);
  app.use('/api/v1/theme', container.themeRouter);

  // 7. Isolated Admin API Router (Mounted ONLY when ADMIN_API_ENABLED=true)
  if (env.ADMIN_API_ENABLED) {
    app.use('/admin-api/v1/auth', container.adminAuthRouter);
    app.use('/admin-api/v1/content', container.adminContentRouter);
    app.use('/admin-api/v1/events', container.adminEventsRouter);
    app.use('/admin-api/v1/payments', container.adminPaymentsRouter);
    app.use('/admin-api/v1/resources', container.adminResourcesRouter);
    app.use('/admin-api/v1/members', container.adminMembersRouter);
    app.use('/admin-api/v1/theme', container.adminThemeRouter);
  }

  // 8. Central Error Handler
  app.use(errorHandler);

  return app;
}
