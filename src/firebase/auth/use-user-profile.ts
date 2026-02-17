
'use client';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

// This hook now correctly fetches the user's authoritative profile from the 'personnel' collection.
export function useUserProfile() {
    const { user } = useUser();
    const db = useFirestore();

    // The document reference now points to the 'personnel' collection, using the user's UID.
    const userProfileRef = useMemoFirebase(() => {
        if (!db || !user?.uid) return null;
        return doc(db, 'personnel', user.uid);
    }, [db, user?.uid]);

    // The data returned will be the full personnel document, which includes the 'rol_t' field.
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{rol_t: 'Administrador' | 'Supervisor' | 'Técnico'}>(userProfileRef);

    return { userProfile, isProfileLoading };
}
