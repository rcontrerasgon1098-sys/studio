
'use client';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
    const { user } = useUser();
    const db = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!db || !user?.uid) return null;
        return doc(db, 'users', user.uid);
    }, [db, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: 'admin' | 'supervisor' | 'tecnico'}>(userProfileRef);

    return { userProfile, isProfileLoading };
}
