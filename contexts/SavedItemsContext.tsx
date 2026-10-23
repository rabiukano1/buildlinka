import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { BackendProduct } from '../lib/backend';

type SavedContextType = {
  items: BackendProduct[];
  savedIds: Set<string>;
  isSaved: (productId: string) => boolean;
  toggleSave: (product: BackendProduct) => void;
  clearSaved: () => void;
  loading: boolean;
};

const SavedContext = createContext<SavedContextType | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const ids = useQuery(api.saved.ids, isAuthenticated ? {} : 'skip');
  const savedIdsList = ids ?? [];
  const products = useQuery(
    api.products.byIds,
    savedIdsList.length ? { ids: savedIdsList as Id<'products'>[] } : 'skip',
  );
  const toggle = useMutation(api.saved.toggle);
  const clear = useMutation(api.saved.clear);

  const items = useMemo(() => {
    const byId = new Map((products ?? []).map((p) => [p._id, p as BackendProduct]));
    return savedIdsList.map((id) => byId.get(id)).filter((p): p is BackendProduct => !!p);
  }, [products, savedIdsList]);

  const savedIds = useMemo(() => new Set<string>(savedIdsList as string[]), [savedIdsList]);

  const value: SavedContextType = {
    items,
    savedIds,
    isSaved: (productId) => savedIds.has(productId),
    toggleSave: (product) => { void toggle({ productId: product._id as unknown as Id<'products'> }); },
    clearSaved: () => { void clear({}); },
    loading: isAuthenticated && ids === undefined,
  };

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within a SavedProvider');
  return context;
}
