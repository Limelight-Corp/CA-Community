import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from './app';
import { AppContainer } from './container';
import { PROTOTYPE_EVENTS, DEFAULT_DARK_TOKENS } from '@ascend/shared';

import { createAuthRouter } from './modules/auth/auth.routes';
import { createAdminAuthRouter } from './modules/auth/admin-auth.routes';
import { AuthService } from './modules/auth/auth.service';

import { createContentRouter } from './modules/content/content.routes';
import { createAdminContentRouter } from './modules/content/admin-content.routes';
import { ContentService } from './modules/content/content.service';
import { ContentController } from './modules/content/content.controller';

import { createEventsRouter } from './modules/events/events.routes';
import { createAdminEventsRouter } from './modules/events/admin-events.routes';
import { EventsService } from './modules/events/events.service';
import { EventsController } from './modules/events/events.controller';

import { createPaymentsRouter } from './modules/payments/payments.routes';
import { createAdminPaymentsRouter } from './modules/payments/admin-payments.routes';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { RazorpayProvider } from './modules/payments/razorpay.provider';

import { createResourcesRouter } from './modules/resources/resources.routes';
import { createAdminResourcesRouter } from './modules/resources/admin-resources.routes';
import { ResourcesService } from './modules/resources/resources.service';
import { ResourcesController } from './modules/resources/resources.controller';

import { createMembersRouter } from './modules/members/members.routes';
import { createAdminMembersRouter } from './modules/members/admin-members.routes';
import { MembersService } from './modules/members/members.service';
import { MembersController } from './modules/members/members.controller';

import { createThemeRouter } from './modules/theme/theme.routes';
import { createAdminThemeRouter } from './modules/theme/admin-theme.routes';
import { ThemeService } from './modules/theme/theme.service';
import { ThemeController } from './modules/theme/theme.controller';

function createTestContainer(): AppContainer {
  const mockAuditService: any = {
    log: async () => {},
  };

  const mockEventsRepo: any = {
    listEvents: async () => ({ items: PROTOTYPE_EVENTS, total: PROTOTYPE_EVENTS.length, page: 1, limit: 10 }),
    listUpcomingEvents: async () => PROTOTYPE_EVENTS,
    getEventBySlug: async (slug: string) => PROTOTYPE_EVENTS.find((e) => e.slug === slug) || null,
    getEventById: async (id: string) => PROTOTYPE_EVENTS.find((e: any) => e.id === id || e.slug === id) || null,
  };

  const mockContentRepo: any = {
    getBlockByKey: async (k: string) => ({ key: k, content: {} }),
    getBlocksBySection: async () => [],
    getAllBlocks: async () => [],
    listNews: async () => ({ items: [], total: 0, page: 1, limit: 10 }),
    getNewsBySlug: async () => null,
  };

  const mockPaymentsRepo: any = {
    getOrderById: async (id: string) => {
      if (id === 'order_test_123') {
        return {
          id: 'order_test_123',
          orderNumber: 'ASC27-TEST-1234',
          status: 'PENDING',
          razorpayOrderId: 'order_rzp_mock_123',
          totalAmount: 1180,
          currency: 'INR',
          itemType: 'EVENT_REGISTRATION',
          itemId: 'event_launch',
          metadata: {},
        };
      }
      return null;
    },
  };

  const mockAuthRepo: any = {
    findByEmail: async () => null,
  };

  const mockThemeRepo: any = {
    getActiveTheme: async () => ({
      tokens: DEFAULT_DARK_TOKENS,
      version: 1,
    }),
  };

  const mockResourcesRepo: any = {
    listResources: async () => ({ items: [], total: 0, page: 1, limit: 10 }),
  };

  const mockMembersRepo: any = {
    listDirectory: async () => ({ items: [], total: 0, page: 1, limit: 10 }),
  };

  const mockCacheStore: any = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
  };

  const razorpayProvider = new RazorpayProvider();

  const authService = new AuthService(mockAuthRepo, mockAuditService, mockCacheStore);
  const authController = {
    register: async () => {},
    login: async () => {},
    adminLogin: async (req: any, res: any) => {
      try {
        await authService.adminLogin(req.body);
      } catch (err: any) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: err.message } });
      }
    },
    refresh: async () => {},
    logout: async () => {},
  } as any;

  const contentService = new ContentService(mockContentRepo, mockAuditService);
  const contentController = new ContentController(contentService);

  const eventsService = new EventsService(mockEventsRepo, mockAuditService);
  const eventsController = new EventsController(eventsService);

  const paymentsService = new PaymentsService(mockPaymentsRepo, mockEventsRepo, razorpayProvider, mockAuditService);
  const paymentsController = new PaymentsController(paymentsService);

  const resourcesService = new ResourcesService(mockResourcesRepo, mockAuditService);
  const resourcesController = new ResourcesController(resourcesService);

  const membersService = new MembersService(mockMembersRepo, mockAuditService);
  const membersController = new MembersController(membersService);

  const themeService = new ThemeService(mockThemeRepo, mockAuditService);
  const themeController = new ThemeController(themeService);

  const mockAuthMiddleware: any = (_req: any, _res: any, next: any) => next();

  return {
    prisma: {} as any,
    cacheStore: mockCacheStore,
    authRouter: createAuthRouter(authController),
    adminAuthRouter: createAdminAuthRouter(authController, mockAuthMiddleware),
    contentRouter: createContentRouter(contentController),
    adminContentRouter: createAdminContentRouter(contentController, mockAuthMiddleware),
    eventsRouter: createEventsRouter(eventsController, mockAuthMiddleware, mockAuthMiddleware),
    adminEventsRouter: createAdminEventsRouter(eventsController, mockAuthMiddleware),
    paymentsRouter: createPaymentsRouter(paymentsController, mockAuthMiddleware, mockAuthMiddleware),
    adminPaymentsRouter: createAdminPaymentsRouter(paymentsController, mockAuthMiddleware),
    resourcesRouter: createResourcesRouter(resourcesController, mockAuthMiddleware),
    adminResourcesRouter: createAdminResourcesRouter(resourcesController, mockAuthMiddleware),
    membersRouter: createMembersRouter(membersController, mockAuthMiddleware),
    adminMembersRouter: createAdminMembersRouter(membersController, mockAuthMiddleware),
    themeRouter: createThemeRouter(themeController),
    adminThemeRouter: createAdminThemeRouter(themeController, mockAuthMiddleware),
  } as unknown as AppContainer;
}

test('End-to-End API Integration Suite', async (t) => {
  const container = createTestContainer();
  const app = createApp(container);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(() => {
    server.close();
  });

  await t.test('1. Health check & Readiness probes return status 200', async () => {
    const resHealth = await fetch(`${baseUrl}/health`);
    assert.equal(resHealth.status, 200);
    const dataHealth = await resHealth.json();
    assert.equal(dataHealth.status, 'ok');
    assert.equal(dataHealth.service, 'ASCEND CA Community API');

    const resHealthz = await fetch(`${baseUrl}/healthz`);
    assert.equal(resHealthz.status, 200);

    const resReadyz = await fetch(`${baseUrl}/readyz`);
    assert.equal(resReadyz.status, 200);
  });

  await t.test('2. OpenAPI schema specification is served correctly', async () => {
    const res = await fetch(`${baseUrl}/api-docs.json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.0');
    assert.equal(spec.info.title, 'ASCEND CA Community API');
  });

  await t.test('3. Public content: Wings & Speakers catalogs are populated', async () => {
    const wingsRes = await fetch(`${baseUrl}/api/v1/content/wings`);
    assert.equal(wingsRes.status, 200);
    const wingsData = await wingsRes.json();
    assert.ok(wingsData.success);
    assert.ok(Array.isArray(wingsData.data));
    assert.equal(wingsData.data.length, 10);
    assert.equal(wingsData.data[0].number, 1);

    const speakersRes = await fetch(`${baseUrl}/api/v1/content/speakers`);
    assert.equal(speakersRes.status, 200);
    const speakersData = await speakersRes.json();
    assert.ok(speakersData.success);
    assert.ok(Array.isArray(speakersData.data));
    assert.ok(speakersData.data.length >= 6);
  });

  await t.test('4. Events catalog serves active events with pricing structure', async () => {
    const eventsRes = await fetch(`${baseUrl}/api/v1/events`);
    assert.equal(eventsRes.status, 200);
    const eventsData = await eventsRes.json();
    assert.ok(eventsData.success);
    assert.ok(Array.isArray(eventsData.data));
    assert.ok(eventsData.data.length >= 4);

    const firstEvent = eventsData.data[0];
    assert.ok(firstEvent.slug);
    assert.ok(typeof firstEvent.fee === 'number');
    assert.ok(typeof firstEvent.memberFee === 'number');

    const singleRes = await fetch(`${baseUrl}/api/v1/events/${firstEvent.slug}`);
    assert.equal(singleRes.status, 200);
    const singleData = await singleRes.json();
    assert.ok(singleData.success);
    assert.equal(singleData.data.slug, firstEvent.slug);
  });

  await t.test('5. Theme endpoint returns published tokens with WCAG contrast audit', async () => {
    const themeRes = await fetch(`${baseUrl}/api/v1/theme`);
    assert.equal(themeRes.status, 200);
    const themeData = await themeRes.json();
    assert.ok(themeData.success);
    assert.ok(themeData.data.tokens);
    assert.equal(themeData.data.tokens.bg, '#03050F');
    assert.ok(themeData.data.contrastAudit);
    assert.ok(themeData.data.contrastAudit.results.length >= 4);
    assert.ok(themeData.data.contrastAudit.results[0].ratio > 7.0);
    assert.equal(themeData.data.contrastAudit.results[0].wcagAA, true);
    assert.equal(themeData.data.contrastAudit.results[0].wcagAAA, true);
  });

  await t.test('6. Payments verification rejects invalid/missing HMAC signatures safely', async () => {
    const res = await fetch(`${baseUrl}/api/v1/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order_test_123',
        razorpayPaymentId: 'pay_test_456',
        razorpaySignature: 'invalid_tampered_signature_hex',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'BAD_REQUEST');
  });

  await t.test('7. Admin endpoints enforce strict isolation and reject invalid logins', async () => {
    const res = await fetch(`${baseUrl}/admin-api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid@admin.ascend-ca.in',
        password: 'WrongPassword123!',
      }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'INVALID_CREDENTIALS');
  });
});
