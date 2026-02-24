
'use server';
/**
 * @fileOverview Flow to close a project and generate a final summary Work Order.
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
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
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
      
      // 3. Generate Summary Text
      const summaryText = `Resumen Final Proyecto: ${projectData.name}. 
Total de órdenes procesadas: ${allOts.length}.
Empresa: ${projectData.clientName}.
Detalles consolidados:
${allOts.map((ot, i) => `${i+1}. Folio #${ot.folio}: ${ot.description || 'Sin descripción'}`).join('\n')}`;

      // 4. Update Project Status
      await updateDoc(projectRef, {
        status: 'Completed',
        endDate: new Date().toISOString(),
        summary: summaryText
      });

      // 5. Create special summary Work Order in Historial
      const summaryOtId = `SUM-${input.projectId}`;
      const summaryOtData = {
        id: summaryOtId,
        folio: Math.floor(100000 + Math.random() * 900000), // Folio único para el resumen
        projectId: input.projectId,
        isProjectSummary: true,
        clientName: projectData.clientName,
        clientId: projectData.clientId,
        createdBy: input.closedByUid,
        status: 'Completed',
        description: summaryText,
        startDate: projectData.startDate,
        endDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        address: allOts[0]?.address || 'N/A', // Usamos la dirección de la primera OT como referencia
      };

      await setDoc(doc(db, 'historial', summaryOtId), summaryOtData);

      return { success: true };
    } catch (error: any) {
      console.error('Error closing project:', error);
      return { success: false, error: error.message };
    }
  }
);
