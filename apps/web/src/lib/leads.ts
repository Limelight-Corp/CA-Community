import type { CommunityContactMessage } from '@ascend/shared';
import { store } from './community-store';
import { notifyContactMessage } from './notifications';
import type { contactMessageSchema } from './form-schemas';
import type { z } from 'zod';

/**
 * Saves a contact message / lead to the PRIVATE store with status "new" — it shows up in the
 * admin console under Messages. Shared by the contact form and the support assistant.
 */
export async function saveContactMessage(input: z.output<typeof contactMessageSchema>): Promise<CommunityContactMessage> {
  const saved = await store.createMessage({ ...input, status: 'new' });
  await notifyContactMessage(saved);
  return saved;
}
