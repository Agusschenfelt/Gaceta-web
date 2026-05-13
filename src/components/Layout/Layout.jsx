// Layout.jsx Recomendado
import { Outlet } from "react-router-dom";
import NavbarDemo from "./Navbar";
import FooterGaceta from "./FooterGaceta";
import NoiseOverlay from "./NoiseOverlay";

export default function Layout() {
  return (
    <>
      <NoiseOverlay />
      <NavbarDemo />
      {/* bg-[#0a0a0a] asegura fondo negro si el contenido es corto */}
      <main className="flex-1 flex flex-col min-h-screen bg-fondo">
        <Outlet />
      </main>
      <FooterGaceta />
    </>
  );
}