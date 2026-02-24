
'use server';
/**
 * @fileOverview Flow to close a project and generate a final summary Work Order.
 * The summary is created in 'ordenes' so it can follow the signature process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, setDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

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
      if (!getApps().length) initializeApp(firebaseConfig);
      const db = getFirestore();

      // 1. Get Project Data
      const projectRef = doc(db, 'projects', input.projectId);
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) throw new Error('El proyecto no existe.');
      const projectData = projectSnap.data();

      // 2. Collect all OTs related to this project (from both collections)
      const activeOtsQuery = query(collection(db, 'ordenes'), where('projectId', '==', input.projectId));
      const historyOtsQuery = query(collection(db, 'historial'), where('projectId', '==', input.projectId));
      
      const [activeSnap, historySnap] = await Promise.all([
        getDocs(activeOtsQuery),
        getDocs(historyOtsQuery)
      ]);

      const allOts = [...activeSnap.docs, ...historySnap.docs].map(d => d.data());
      
      // 3. Generate Summary Text (Consolidating all OT descriptions)
      const summaryText = `ACTA DE CIERRE FINAL - PROYECTO: ${projectData.name.toUpperCase()}
--------------------------------------------------
Resumen consolidado de trabajos realizados:
${allOts.map((ot, i) => `- Folio #${ot.folio}: ${ot.description || 'Sin descripción'}`).join('\n')}

Este documento certifica la entrega total y recepción conforme de todas las etapas del proyecto mencionado.`;

      // 4. Update Project Status
      await updateDoc(projectRef, {
        status: 'Completed',
        endDate: new Date().toISOString(),
        summary: summaryText
      });

      // 5. Create special summary Work Order in 'ordenes' (NOT history yet)
      // This allows the client to sign the final consolidated report.
      const summaryOtId = `ACTA-${input.projectId}`;
      const summaryOtData = {
        id: summaryOtId,
        folio: Math.floor(100000 + Math.random() * 900000),
        projectId: input.projectId,
        isProjectSummary: true,
        clientName: projectData.clientName,
        clientId: projectData.clientId || "",
        createdBy: input.closedByUid,
        status: 'Pendiente', // Set to Pending so it can be edited/signed
        description: summaryText,
        startDate: projectData.startDate,
        address: allOts[0]?.address || 'Dirección de Proyecto',
        building: allOts[0]?.building || '',
        floor: allOts[0]?.floor || '',
        updatedAt: new Date().toISOString(),
        team: projectData.teamNames || [projectData.creatorEmail],
        teamIds: projectData.teamIds || [input.closedByUid]
      };

      // We use setDoc to ensure we have a predictable ID (ACTA-projectId)
      await setDoc(doc(db, 'ordenes', summaryOtId), summaryOtData);

      return { success: true, orderId: summaryOtId };
    } catch (error: any) {
      console.error('Error closing project:', error);
      return { success: false, error: error.message };
    }
  }
);
