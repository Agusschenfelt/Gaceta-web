import { createContext, useContext, useState } from "react";

const MenuContext = createContext({ open: false, setOpen: () => {} });

export default function MenuProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
