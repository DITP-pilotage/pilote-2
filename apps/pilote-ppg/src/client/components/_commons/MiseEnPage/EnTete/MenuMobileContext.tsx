import { createContext, ReactNode, useContext, useMemo, useState } from "react";

const MenuMobileContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export const MenuMobileProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <MenuMobileContext.Provider value={value}>
      {children}
    </MenuMobileContext.Provider>
  );
};

export const useMenuMobile = () => {
  const context = useContext(MenuMobileContext);
  if (!context) {
    throw new Error("useMenuMobile doit être utilisé dans MenuMobileProvider");
  }
  return context;
};
