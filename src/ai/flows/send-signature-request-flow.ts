
'use server';
/**
 * @fileOverview Flow to send a remote signature request link to a client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const SendSignatureRequestInputSchema = z.object({
  orderId: z.string(),
  recipientEmail: z.string().email(),
  clientName: z.string(),
  folio: z.number(),
  baseUrl: z.string(),
});
export type SendSignatureRequestInput = z.infer<typeof SendSignatureRequestInputSchema>;

const SendSignatureRequestOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SendSignatureRequestOutput = z.infer<typeof SendSignatureRequestOutputSchema>;

export async function sendSignatureRequest(input: SendSignatureRequestInput): Promise<SendSignatureRequestOutput> {
  return sendSignatureRequestFlow(input);
}

const sendSignatureRequestFlow = ai.defineFlow(
  {
    name: 'sendSignatureRequestFlow',
    inputSchema: SendSignatureRequestInputSchema,
    outputSchema: SendSignatureRequestOutputSchema,
  },
  async (input) => {
    try {
      // 1. Generate secure token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // 7 days expiry

      // 2. Initialize Firebase for server-side update
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      const orderRef = doc(db, 'ordenes', input.orderId);

      // 3. Update Order with token and status
      await updateDoc(orderRef, {
        signatureToken: token,
        tokenExpiry: expiry.toISOString(),
        status: 'Pending Signature',
      });

      // 4. Send Email
      const signatureLink = `${input.baseUrl}/firmar/${input.orderId}?token=${token}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #38A3A5; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Solicitud de Firma Digital</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${input.clientName}</strong>,</p>
            <p>Se ha generado una solicitud de firma remota para la Orden de Trabajo <strong>#${input.folio}</strong>.</p>
            
            <p>Por favor, utilice el siguiente botón para revisar el resumen de los trabajos realizados y realizar su firma digital desde su dispositivo móvil o computador:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureLink}" style="background-color: #22577A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Revisar y Firmar OT</a>
            </div>

            <p style="font-size: 12px; color: #888;">Este enlace es único y expirará en 7 días.</p>
            <p>Gracias por confiar en ICSA Ingeniería Comunicaciones S.A.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
            Este es un mensaje automático, por favor no responda.
          </div>
        </div>
      `;

      await sendEmailSMTP(
        input.recipientEmail,
        `ICSA - Solicitud de Firma Digital OT #${input.folio}`,
        htmlContent
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendSignatureRequestFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
