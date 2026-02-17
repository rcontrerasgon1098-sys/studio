'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 * IMPORTANT! The query passed to this hook MUST be memoized, for example with useMemo or useMemoFirebase.
 * Failure to do so will result in an infinite loop.
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} q - The Firestore Query. If null/undefined, the hook will not fetch data.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    q: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(!!q);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the query is null or undefined, don't do anything.
    if (!q) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q, // Use the query directly as provided.
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // When an error occurs (like a permission error), create a contextual error object.
        let path = `[path could not be determined]`;
        // A CollectionReference is a type of query that has a public 'path' property.
        if ((q as CollectionReference).path) {
            path = (q as CollectionReference).path;
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        })

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Emit the error for the global error listener to catch and display.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup the listener when the component unmounts or the query changes.
    return () => unsubscribe();
  }, [q]); // The hook re-runs only when the query object itself changes.
  
  return { data, isLoading, error };
}
