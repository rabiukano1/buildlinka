import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Product } from '../constants/MockData';

type SavedState = {
  items: Product[];
};

type SavedAction =
  | { type: 'TOGGLE_SAVE'; product: Product }
  | { type: 'CLEAR' };

type SavedContextType = {
  items: Product[];
  savedIds: Set<string>;
  isSaved: (productId: string) => boolean;
  toggleSave: (product: Product) => void;
  clearSaved: () => void;
};

const SavedContext = createContext<SavedContextType | null>(null);

function savedReducer(state: SavedState, action: SavedAction): SavedState {
  switch (action.type) {
    case 'TOGGLE_SAVE': {
      const exists = state.items.find((p) => p.id === action.product.id);
      if (exists) {
        return { items: state.items.filter((p) => p.id !== action.product.id) };
      }
      return { items: [action.product, ...state.items] };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(savedReducer, { items: [] });

  const savedIds = new Set(state.items.map((p) => p.id));

  const isSaved = (productId: string) => savedIds.has(productId);

  const toggleSave = (product: Product) =>
    dispatch({ type: 'TOGGLE_SAVE', product });

  const clearSaved = () => dispatch({ type: 'CLEAR' });

  return (
    <SavedContext.Provider value={{ items: state.items, savedIds, isSaved, toggleSave, clearSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within a SavedProvider');
  return context;
}
