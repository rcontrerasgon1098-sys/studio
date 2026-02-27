
'use server';
/**
 * @fileOverview Flow to validate and submit a remote signature for a Work Order.
 * Uses Firebase Admin SDK to ensure the move between collections is atomic and authorized.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const SubmitRemoteSignatureInputSchema = z.object({
  orderId: z.string(),
  token: z.string(),
  receiverName: z.string(),
  receiverRut: z.string(),
  receiverEmail: z.string().email().optional(),
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
      initializeFirebaseAdmin();
      const db = getFirestore();
      
      const orderRef = db.collection('ordenes').doc(input.orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        return { success: false, error: 'La orden no existe o ya ha sido procesada.' };
      }

      const orderData = orderSnap.data()!;

      // 1. Validar Token y Expiración
      if (orderData.signatureToken !== input.token) {
        return { success: false, error: 'Token no válido.' };
      }

      const expiry = new Date(orderData.tokenExpiry);
      if (expiry < new Date()) {
        return { success: false, error: 'Enlace expirado.' };
      }

      // 2. Preparar datos finales
      const completedData = {
        ...orderData,
        clientReceiverName: input.receiverName,
        clientReceiverRut: input.receiverRut,
        clientReceiverEmail: input.receiverEmail || orderData.clientReceiverEmail || "",
        clientSignatureUrl: input.signatureUrl,
        signatureDate: new Date().toISOString(),
        status: 'Completed',
        updatedAt: new Date().toISOString(),
      };

      // 3. Mover a Historial usando una transacción para asegurar integridad
      await db.runTransaction(async (transaction) => {
        transaction.set(db.collection('historial').doc(input.orderId), completedData);
        transaction.delete(orderRef);
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error in submitRemoteSignatureFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
