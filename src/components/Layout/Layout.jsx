// Layout.jsx
import { Outlet } from "react-router-dom";
import NavbarDemo from "./Navbar";
import FooterGaceta from "./FooterGaceta";

export default function Layout() {
  return (
    <>
      <NavbarDemo />
      <main className="flex-1 flex flex-col gap-40 min-h-screen">
        <Outlet />
        {/* ❌ <MusicPlayer />  // eliminar, ya lo rendereamos en App.jsx */}
      </main>
      <FooterGaceta />
    </>
  );
}
