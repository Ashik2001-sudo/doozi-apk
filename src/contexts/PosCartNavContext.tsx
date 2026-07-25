import React, { createContext, useContext, useMemo, useState } from 'react';

type PosCartNavContextValue = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
};

const PosCartNavContext = createContext<PosCartNavContextValue | null>(null);

export function PosCartNavProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const value = useMemo(
    () => ({ cartOpen, setCartOpen, cartCount, setCartCount }),
    [cartOpen, cartCount],
  );

  return <PosCartNavContext.Provider value={value}>{children}</PosCartNavContext.Provider>;
}

export function usePosCartNav() {
  const ctx = useContext(PosCartNavContext);
  if (!ctx) {
    throw new Error('usePosCartNav must be used within PosCartNavProvider');
  }
  return ctx;
}
