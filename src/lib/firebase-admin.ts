
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

export function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // En App Hosting / Cloud Run, Firebase Admin puede inicializarse sin credenciales explícitas
  // si el Service Account tiene los permisos necesarios.
  return admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
