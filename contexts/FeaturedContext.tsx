import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type FeaturedContextType = {
  popularVendorIds: string[];
  popularWorkerIds: string[];
  toggleVendorPopular: (id: string) => void;
  toggleWorkerPopular: (id: string) => void;
};

const FeaturedContext = createContext<FeaturedContextType | null>(null);

export function FeaturedProvider({ children }: { children: ReactNode }) {
  const [popularVendorIds, setPopularVendorIds] = useState<string[]>([
    'v1', 'v2', 'v4',
  ]);
  const [popularWorkerIds, setPopularWorkerIds] = useState<string[]>([
    'w1', 'w2', 'w4', 'w6',
  ]);

  const toggleVendorPopular = useCallback((id: string) => {
    setPopularVendorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleWorkerPopular = useCallback((id: string) => {
    setPopularWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  return (
    <FeaturedContext.Provider value={{ popularVendorIds, popularWorkerIds, toggleVendorPopular, toggleWorkerPopular }}>
      {children}
    </FeaturedContext.Provider>
  );
}

export function useFeatured() {
  const context = useContext(FeaturedContext);
  if (!context) throw new Error('useFeatured must be used within a FeaturedProvider');
  return context;
}
