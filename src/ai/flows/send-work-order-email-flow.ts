
'use server';
/**
 * @fileOverview A flow to send a completed Work Order summary to the client via email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';

const SendWorkOrderEmailInputSchema = z.object({
  recipientEmail: z.string().email(),
  clientName: z.string(),
  folio: z.number(),
  orderDate: z.string(),
  summary: z.string(),
  pdfLink: z.string().optional(),
});
export type SendWorkOrderEmailInput = z.infer<typeof SendWorkOrderEmailInputSchema>;

export async function sendWorkOrderEmail(input: SendWorkOrderEmailInput) {
  return sendWorkOrderEmailFlow(input);
}

const sendWorkOrderEmailFlow = ai.defineFlow(
  {
    name: 'sendWorkOrderEmailFlow',
    inputSchema: SendWorkOrderEmailInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #38A3A5; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">ICSA - Orden de Trabajo Finalizada</h1>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <p>Estimado/a <strong>${input.clientName}</strong>,</p>
          <p>Le informamos que la Orden de Trabajo <strong>#${input.folio}</strong> ha sido finalizada con éxito.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Fecha:</strong> ${new Date(input.orderDate).toLocaleDateString()}</p>
            <p style="margin: 10px 0 0 0;"><strong>Resumen de Actividades:</strong></p>
            <p style="margin: 5px 0 0 0; font-style: italic;">${input.summary || 'N/A'}</p>
          </div>

          <p>Adjuntamos el enlace para visualizar su comprobante digital:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${input.pdfLink || '#'}" style="background-color: #22577A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Orden de Trabajo</a>
          </div>

          <p>Gracias por confiar en ICSA Ingeniería Comunicaciones S.A.</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
          Este es un mensaje automático, por favor no responda a este correo.
        </div>
      </div>
    `;

    await sendEmailSMTP(
      input.recipientEmail,
      `ICSA - Orden de Trabajo #${input.folio} Finalizada`,
      htmlContent
    );

    return { success: true };
  }
);
