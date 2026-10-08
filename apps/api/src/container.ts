import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from './lib/prisma';
import { createCacheClient, ICacheStore } from './lib/redis';
import { createAuthenticateMiddleware } from './middlewares/authenticate';
import { createAdminAuthenticateMiddleware } from './middlewares/adminAuthenticate';

import { AuditRepository } from './modules/audit/audit.repository';
import { AuditService } from './modules/audit/audit.service';

import { AuthRepository } from './modules/auth/auth.repository';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAdminAuthRouter } from './modules/auth/admin-auth.routes';

export interface AppContainer {
  prisma: PrismaClient;
  cacheStore: ICacheStore;

  // Middlewares
  authenticate: ReturnType<typeof createAuthenticateMiddleware>;
  adminAuthenticate: ReturnType<typeof createAdminAuthenticateMiddleware>;

  // Services
  auditService: AuditService;
  authService: AuthService;

  // Controllers
  authController: AuthController;

  // Routers
  authRouter: ReturnType<typeof createAuthRouter>;
  adminAuthRouter: ReturnType<typeof createAdminAuthRouter>;
}

export function createContainer(): AppContainer {
  const prisma = createPrismaClient();
  const { store: cacheStore } = createCacheClient();

  // Core Middlewares
  const authenticate = createAuthenticateMiddleware(cacheStore);
  const adminAuthenticate = createAdminAuthenticateMiddleware(cacheStore);

  // Repositories
  const auditRepository = new AuditRepository(prisma);
  const authRepository = new AuthRepository(prisma);

  // Services
  const auditService = new AuditService(auditRepository);
  const authService = new AuthService(authRepository, auditService, cacheStore);

  // Controllers
  const authController = new AuthController(authService);

  // Routers
  const authRouter = createAuthRouter(authController);
  const adminAuthRouter = createAdminAuthRouter(authController, adminAuthenticate);

  return {
    prisma,
    cacheStore,
    authenticate,
    adminAuthenticate,
    auditService,
    authService,
    authController,
    authRouter,
    adminAuthRouter,
  };
}
