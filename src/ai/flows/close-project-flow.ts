
'use server';
/**
 * @fileOverview Flow to close a project and generate a final summary Work Order.
 * Uses Firebase Admin SDK to bypass security rules on the server.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const CloseProjectInputSchema = z.object({
  projectId: z.string(),
  closedByUid: z.string(),
});

export async function closeProject(input: z.infer<typeof CloseProjectInputSchema>) {
  return closeProjectFlow(input);
}

const closeProjectFlow = ai.defineFlow(
  {
    name: 'closeProjectFlow',
    inputSchema: CloseProjectInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional(), orderId: z.string().optional() }),
  },
  async (input) => {
    try {
      initializeFirebaseAdmin();
      const db = getFirestore();

      // 1. Get Project Data
      const projectRef = db.collection('projects').doc(input.projectId);
      const projectSnap = await projectRef.get();
      if (!projectSnap.exists) throw new Error('El proyecto no existe.');
      const projectData = projectSnap.data()!;

      // 2. Collect all OTs related to this project (from both collections)
      const activeOtsSnap = await db.collection('ordenes').where('projectId', '==', input.projectId).get();
      const historyOtsSnap = await db.collection('historial').where('projectId', '==', input.projectId).get();
      
      const allOts = [...activeOtsSnap.docs, ...historyOtsSnap.docs].map(d => d.data());
      
      // 3. Generate Summary Text
      const summaryText = `ACTA DE CIERRE FINAL - PROYECTO: ${projectData.name.toUpperCase()}
--------------------------------------------------
Resumen consolidado de trabajos realizados:
${allOts.map((ot) => `- Folio #${ot.folio}: ${ot.description || 'Sin descripción'}`).join('\n')}

Este documento certifica la entrega total y recepción conforme de todas las etapas del proyecto mencionado.`;

      // 4. Update Project Status
      await projectRef.update({
        status: 'Completed',
        endDate: new Date().toISOString(),
        summary: summaryText
      });

      // 5. Create special summary Work Order in 'ordenes'
      const summaryOtId = `ACTA-${input.projectId}`;
      const summaryOtData = {
        id: summaryOtId,
        folio: Math.floor(100000 + Math.random() * 900000),
        projectId: input.projectId,
        isProjectSummary: true,
        clientName: projectData.clientName || "Sin Cliente",
        clientId: projectData.clientId || "",
        createdBy: input.closedByUid,
        status: 'Pendiente',
        description: summaryText,
        startDate: projectData.startDate || new Date().toISOString(),
        address: allOts[0]?.address || 'Dirección de Proyecto',
        building: allOts[0]?.building || '',
        floor: allOts[0]?.floor || '',
        updatedAt: new Date().toISOString(),
        team: projectData.teamNames || [projectData.creatorEmail || "Admin"],
        teamIds: projectData.teamIds || [input.closedByUid]
      };

      await db.collection('ordenes').doc(summaryOtId).set(summaryOtData);

      return { success: true, orderId: summaryOtId };
    } catch (error: any) {
      console.error('Error closing project:', error);
      return { success: false, error: error.message };
    }
  }
);
