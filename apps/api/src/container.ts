import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from './lib/prisma';
import { createCacheClient, ICacheStore } from './lib/redis';
import {
  createAuthenticateMiddleware,
  createOptionalAuthenticateMiddleware,
} from './middlewares/authenticate';
import { createAdminAuthenticateMiddleware } from './middlewares/adminAuthenticate';

import { AuditRepository } from './modules/audit/audit.repository';
import { AuditService } from './modules/audit/audit.service';

import { AuthRepository } from './modules/auth/auth.repository';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAdminAuthRouter } from './modules/auth/admin-auth.routes';

import { ContentRepository } from './modules/content/content.repository';
import { ContentService } from './modules/content/content.service';
import { ContentController } from './modules/content/content.controller';
import { createContentRouter } from './modules/content/content.routes';
import { createAdminContentRouter } from './modules/content/admin-content.routes';

import { EventsRepository } from './modules/events/events.repository';
import { EventsService } from './modules/events/events.service';
import { EventsController } from './modules/events/events.controller';
import { createEventsRouter } from './modules/events/events.routes';
import { createAdminEventsRouter } from './modules/events/admin-events.routes';

import { PaymentsRepository } from './modules/payments/payments.repository';
import { RazorpayProvider } from './modules/payments/razorpay.provider';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { createPaymentsRouter } from './modules/payments/payments.routes';
import { createAdminPaymentsRouter } from './modules/payments/admin-payments.routes';

import { ResourcesRepository } from './modules/resources/resources.repository';
import { ResourcesService } from './modules/resources/resources.service';
import { ResourcesController } from './modules/resources/resources.controller';
import { createResourcesRouter } from './modules/resources/resources.routes';
import { createAdminResourcesRouter } from './modules/resources/admin-resources.routes';

import { MembersRepository } from './modules/members/members.repository';
import { MembersService } from './modules/members/members.service';
import { MembersController } from './modules/members/members.controller';
import { createMembersRouter } from './modules/members/members.routes';
import { createAdminMembersRouter } from './modules/members/admin-members.routes';

export interface AppContainer {
  prisma: PrismaClient;
  cacheStore: ICacheStore;

  // Middlewares
  authenticate: ReturnType<typeof createAuthenticateMiddleware>;
  optionalAuthenticate: ReturnType<typeof createOptionalAuthenticateMiddleware>;
  adminAuthenticate: ReturnType<typeof createAdminAuthenticateMiddleware>;

  // Services
  auditService: AuditService;
  authService: AuthService;
  contentService: ContentService;
  eventsService: EventsService;
  paymentsService: PaymentsService;
  resourcesService: ResourcesService;
  membersService: MembersService;

  // Controllers
  authController: AuthController;
  contentController: ContentController;
  eventsController: EventsController;
  paymentsController: PaymentsController;
  resourcesController: ResourcesController;
  membersController: MembersController;

  // Routers
  authRouter: ReturnType<typeof createAuthRouter>;
  adminAuthRouter: ReturnType<typeof createAdminAuthRouter>;
  contentRouter: ReturnType<typeof createContentRouter>;
  adminContentRouter: ReturnType<typeof createAdminContentRouter>;
  eventsRouter: ReturnType<typeof createEventsRouter>;
  adminEventsRouter: ReturnType<typeof createAdminEventsRouter>;
  paymentsRouter: ReturnType<typeof createPaymentsRouter>;
  adminPaymentsRouter: ReturnType<typeof createAdminPaymentsRouter>;
  resourcesRouter: ReturnType<typeof createResourcesRouter>;
  adminResourcesRouter: ReturnType<typeof createAdminResourcesRouter>;
  membersRouter: ReturnType<typeof createMembersRouter>;
  adminMembersRouter: ReturnType<typeof createAdminMembersRouter>;
}

export function createContainer(): AppContainer {
  const prisma = createPrismaClient();
  const { store: cacheStore } = createCacheClient();

  // Core Middlewares
  const authenticate = createAuthenticateMiddleware(cacheStore);
  const optionalAuthenticate = createOptionalAuthenticateMiddleware(cacheStore);
  const adminAuthenticate = createAdminAuthenticateMiddleware(cacheStore);

  // Repositories
  const auditRepository = new AuditRepository(prisma);
  const authRepository = new AuthRepository(prisma);
  const contentRepository = new ContentRepository(prisma);
  const eventsRepository = new EventsRepository(prisma);
  const paymentsRepository = new PaymentsRepository(prisma);
  const resourcesRepository = new ResourcesRepository(prisma);
  const membersRepository = new MembersRepository(prisma);

  // Providers
  const paymentProvider = new RazorpayProvider();

  // Services
  const auditService = new AuditService(auditRepository);
  const authService = new AuthService(authRepository, auditService, cacheStore);
  const contentService = new ContentService(contentRepository, auditService);
  const eventsService = new EventsService(eventsRepository, auditService);
  const paymentsService = new PaymentsService(
    paymentsRepository,
    eventsRepository,
    paymentProvider,
    auditService
  );
  const resourcesService = new ResourcesService(resourcesRepository, auditService);
  const membersService = new MembersService(membersRepository, auditService);

  // Controllers
  const authController = new AuthController(authService);
  const contentController = new ContentController(contentService);
  const eventsController = new EventsController(eventsService);
  const paymentsController = new PaymentsController(paymentsService);
  const resourcesController = new ResourcesController(resourcesService);
  const membersController = new MembersController(membersService);

  // Routers
  const authRouter = createAuthRouter(authController);
  const adminAuthRouter = createAdminAuthRouter(authController, adminAuthenticate);
  const contentRouter = createContentRouter(contentController);
  const adminContentRouter = createAdminContentRouter(contentController, adminAuthenticate);
  const eventsRouter = createEventsRouter(eventsController, optionalAuthenticate, authenticate);
  const adminEventsRouter = createAdminEventsRouter(eventsController, adminAuthenticate);
  const paymentsRouter = createPaymentsRouter(paymentsController, optionalAuthenticate, authenticate);
  const adminPaymentsRouter = createAdminPaymentsRouter(paymentsController, adminAuthenticate);
  const resourcesRouter = createResourcesRouter(resourcesController, optionalAuthenticate);
  const adminResourcesRouter = createAdminResourcesRouter(resourcesController, adminAuthenticate);
  const membersRouter = createMembersRouter(membersController, authenticate);
  const adminMembersRouter = createAdminMembersRouter(membersController, adminAuthenticate);

  return {
    prisma,
    cacheStore,
    authenticate,
    optionalAuthenticate,
    adminAuthenticate,
    auditService,
    authService,
    contentService,
    eventsService,
    paymentsService,
    resourcesService,
    membersService,
    authController,
    contentController,
    eventsController,
    paymentsController,
    resourcesController,
    membersController,
    authRouter,
    adminAuthRouter,
    contentRouter,
    adminContentRouter,
    eventsRouter,
    adminEventsRouter,
    paymentsRouter,
    adminPaymentsRouter,
    resourcesRouter,
    adminResourcesRouter,
    membersRouter,
    adminMembersRouter,
  };
}
