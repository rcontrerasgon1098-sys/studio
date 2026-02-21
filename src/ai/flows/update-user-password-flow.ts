
'use server';
/**
 * @fileOverview Flow to update a user's password using Firebase Admin SDK.
 * Only accessible by server-side code (Next.js Server Actions).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const UpdateUserPasswordInputSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(6),
});
export type UpdateUserPasswordInput = z.infer<typeof UpdateUserPasswordInputSchema>;

const UpdateUserPasswordOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type UpdateUserPasswordOutput = z.infer<typeof UpdateUserPasswordOutputSchema>;

export async function updateUserPassword(input: UpdateUserPasswordInput): Promise<UpdateUserPasswordOutput> {
  return updateUserPasswordFlow(input);
}

const updateUserPasswordFlow = ai.defineFlow(
  {
    name: 'updateUserPasswordFlow',
    inputSchema: UpdateUserPasswordInputSchema,
    outputSchema: UpdateUserPasswordOutputSchema,
  },
  async (input) => {
    try {
      initializeFirebaseAdmin();
      const auth = getAuth();

      await auth.updateUser(input.userId, {
        password: input.newPassword,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateUserPasswordFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
