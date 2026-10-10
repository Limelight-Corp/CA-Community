import type { CommunityContactMessage } from '@ascend/shared';
import { mutatePrivate, newId } from './community-store';
import type { contactMessageSchema } from './form-schemas';
import type { z } from 'zod';

/**
 * Saves a contact message / lead to the PRIVATE store with status "new" — it shows up in the
 * admin console under Messages. Shared by the contact form and the support assistant.
 */
export function saveContactMessage(input: z.output<typeof contactMessageSchema>): CommunityContactMessage {
  return mutatePrivate((data) => {
    const message: CommunityContactMessage = {
      id: newId('msg'),
      ...input,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    data.messages.push(message);
    return message;
  });
}
