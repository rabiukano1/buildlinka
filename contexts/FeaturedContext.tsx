import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

type FeaturedContextType = {
  popularVendorIds: string[];
  popularWorkerIds: string[];
  toggleVendorPopular: (id: string) => void;
  toggleWorkerPopular: (id: string) => void;
};

const FeaturedContext = createContext<FeaturedContextType | null>(null);

export function FeaturedProvider({ children }: { children: ReactNode }) {
  const stores = useQuery(api.stores.list, { limit: 100 });
  const workers = useQuery(api.workers.list, { limit: 100 });
  const setStoreFlags = useMutation(api.admin.setStoreFlags);
  const setWorkerFlags = useMutation(api.admin.setWorkerFlags);

  const popularVendorIds = useMemo(() => (stores ?? []).filter((s) => s.featured).map((s) => s._id), [stores]);
  const popularWorkerIds = useMemo(() => (workers ?? []).filter((w) => w.featured).map((w) => w._id), [workers]);

  const value: FeaturedContextType = {
    popularVendorIds,
    popularWorkerIds,
    toggleVendorPopular: (id) => {
      const featured = !popularVendorIds.includes(id as Id<'stores'>);
      void setStoreFlags({ id: id as Id<'stores'>, featured });
    },
    toggleWorkerPopular: (id) => {
      const featured = !popularWorkerIds.includes(id as Id<'workers'>);
      void setWorkerFlags({ id: id as Id<'workers'>, featured });
    },
  };

  return <FeaturedContext.Provider value={value}>{children}</FeaturedContext.Provider>;
}

export function useFeatured() {
  const context = useContext(FeaturedContext);
  if (!context) throw new Error('useFeatured must be used within a FeaturedProvider');
  return context;
}
