
'use server';
/**
 * @fileOverview Flow to validate and submit a remote signature for a Work Order.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const SubmitRemoteSignatureInputSchema = z.object({
  orderId: z.string(),
  token: z.string(),
  receiverName: z.string(),
  receiverRut: z.string(),
  signatureUrl: z.string(), // base64
});
export type SubmitRemoteSignatureInput = z.infer<typeof SubmitRemoteSignatureInputSchema>;

const SubmitRemoteSignatureOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SubmitRemoteSignatureOutput = z.infer<typeof SubmitRemoteSignatureOutputSchema>;

export async function submitRemoteSignature(input: SubmitRemoteSignatureInput): Promise<SubmitRemoteSignatureOutput> {
  return submitRemoteSignatureFlow(input);
}

const submitRemoteSignatureFlow = ai.defineFlow(
  {
    name: 'submitRemoteSignatureFlow',
    inputSchema: SubmitRemoteSignatureInputSchema,
    outputSchema: SubmitRemoteSignatureOutputSchema,
  },
  async (input) => {
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      const orderRef = doc(db, 'ordenes', input.orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return { success: false, error: 'La orden no existe o ya ha sido procesada.' };
      }

      const orderData = orderSnap.data();

      // 1. Validate Token
      if (orderData.signatureToken !== input.token) {
        return { success: false, error: 'El token de firma no es válido.' };
      }

      // 2. Check Expiry
      const expiry = new Date(orderData.tokenExpiry);
      if (expiry < new Date()) {
        return { success: false, error: 'El enlace de firma ha expirado.' };
      }

      // 3. Prepare completed data
      const completedData = {
        ...orderData,
        clientReceiverName: input.receiverName,
        clientReceiverRut: input.receiverRut,
        clientSignatureUrl: input.signatureUrl,
        signatureDate: new Date().toISOString(),
        status: 'Completed',
        updatedAt: new Date().toISOString(),
      };

      // 4. Move to Historial
      const historyRef = doc(db, 'historial', input.orderId);
      await setDoc(historyRef, completedData);
      await deleteDoc(orderRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error in submitRemoteSignatureFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
