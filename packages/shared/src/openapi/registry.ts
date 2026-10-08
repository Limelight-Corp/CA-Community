import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

import {
  LoginWithEmailSchema,
  LoginWithOtpSchema,
  VerifyOtpSchema,
  MemberRegisterSchema,
  AdminLoginSchema,
  AdminSudoReauthSchema,
} from '../schemas/auth.schema';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
  RegisterEventSchema,
} from '../schemas/event.schema';
import {
  CreateOrderSchema,
  VerifyPaymentSchema,
  RefundPaymentSchema,
} from '../schemas/payment.schema';
import { UpdateMemberProfileSchema, MemberQuerySchema } from '../schemas/member.schema';
import { UpdateThemeSettingsSchema } from '../schemas/theme.schema';

export const registry = new OpenAPIRegistry();

// Security Schemes
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Member access token (JWT)',
});

registry.registerComponent('securitySchemes', 'AdminAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Admin access token (JWT) with verified 2FA claim',
});

// Register Core Models
registry.register('LoginWithEmail', LoginWithEmailSchema);
registry.register('LoginWithOtp', LoginWithOtpSchema);
registry.register('VerifyOtp', VerifyOtpSchema);
registry.register('MemberRegister', MemberRegisterSchema);
registry.register('AdminLogin', AdminLoginSchema);
registry.register('AdminSudoReauth', AdminSudoReauthSchema);
registry.register('CreateEvent', CreateEventSchema);
registry.register('UpdateEvent', UpdateEventSchema);
registry.register('EventFilter', EventFilterSchema);
registry.register('RegisterEvent', RegisterEventSchema);
registry.register('CreateOrder', CreateOrderSchema);
registry.register('VerifyPayment', VerifyPaymentSchema);
registry.register('RefundPayment', RefundPaymentSchema);
registry.register('UpdateMemberProfile', UpdateMemberProfileSchema);
registry.register('MemberQuery', MemberQuerySchema);
registry.register('UpdateThemeSettings', UpdateThemeSettingsSchema);

// Register Path Definitions
// Auth Paths
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login-email',
  summary: 'Member login using email and password',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: LoginWithEmailSchema } },
    },
  },
  responses: {
    200: { description: 'Authenticated successfully' },
    401: { description: 'Invalid credentials' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/send-otp',
  summary: 'Send mobile OTP for login/registration',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: LoginWithOtpSchema } },
    },
  },
  responses: {
    200: { description: 'OTP dispatched via SMS/WhatsApp' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/verify-otp',
  summary: 'Verify mobile OTP and authenticate',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: VerifyOtpSchema } },
    },
  },
  responses: {
    200: { description: 'OTP verified successfully' },
    400: { description: 'Invalid or expired OTP' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Register a new member',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: MemberRegisterSchema } },
    },
  },
  responses: {
    201: { description: 'Member registered successfully' },
    409: { description: 'Email or mobile already registered' },
  },
});

// Events Paths
registry.registerPath({
  method: 'get',
  path: '/api/v1/events',
  summary: 'List events with filters',
  tags: ['Events'],
  request: {
    query: EventFilterSchema,
  },
  responses: {
    200: { description: 'List of events' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/events/{idOrSlug}',
  summary: 'Get event details by ID or Slug',
  tags: ['Events'],
  responses: {
    200: { description: 'Event details' },
    404: { description: 'Event not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/events/register',
  summary: 'Register for an event',
  tags: ['Events'],
  request: {
    body: {
      content: { 'application/json': { schema: RegisterEventSchema } },
    },
  },
  responses: {
    200: { description: 'Registration confirmed or payment required' },
  },
});

// Payments Paths
registry.registerPath({
  method: 'post',
  path: '/api/v1/payments/create-order',
  summary: 'Create Razorpay order (server-calculated price)',
  tags: ['Payments'],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateOrderSchema } },
    },
  },
  responses: {
    200: { description: 'Order created with Razorpay order ID' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/payments/verify',
  summary: 'Verify Razorpay payment signature',
  tags: ['Payments'],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: VerifyPaymentSchema } },
    },
  },
  responses: {
    200: { description: 'Payment verified and ticket/membership confirmed' },
    400: { description: 'Invalid HMAC signature' },
  },
});

// Theme Path
registry.registerPath({
  method: 'get',
  path: '/api/v1/theme',
  summary: 'Get active published design tokens & fonts',
  tags: ['Theme'],
  responses: {
    200: { description: 'Active theme tokens' },
  },
});

// Admin Paths
registry.registerPath({
  method: 'post',
  path: '/admin-api/v1/auth/login',
  summary: 'Admin login with 2FA verification',
  tags: ['Admin Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: AdminLoginSchema } },
    },
  },
  responses: {
    200: { description: 'Admin session created' },
    401: { description: 'Invalid credentials or TOTP code' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/admin-api/v1/auth/sudo',
  summary: 'Re-authenticate for sensitive action (Sudo mode)',
  tags: ['Admin Auth'],
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: AdminSudoReauthSchema } },
    },
  },
  responses: {
    200: { description: 'Sudo mode granted for 5 minutes' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/admin-api/v1/theme',
  summary: 'Update theme settings draft',
  tags: ['Admin Theme'],
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateThemeSettingsSchema } },
    },
  },
  responses: {
    200: { description: 'Theme draft saved' },
  },
});

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'ASCEND CA Community API',
      version: '1.0.0',
      description:
        'Pan-India community platform REST API for Chartered Accountants, corporate leaders, and students.',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local Development Server' },
      { url: 'https://api.ascend-ca.in', description: 'Production API' },
    ],
  });
}
