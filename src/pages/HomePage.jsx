import FooterGaceta from "../components/FooterGaceta";
import SeccionGacetaShop from "../components/seccionesHome/SeccionGacetaShop";
import SeccionProximosShows from "../components/seccionesHome/SeccionProximosShows";
import SeccionGacetaTv from "../components/seccionesHome/SeccionGacetaTv";
import SeccionArtistas from "../components/seccionesHome/SeccionArtistas";
import SeccionSobreNosotros from "../components/seccionesHome/SeccionSobreNosotros";
import SeccionHeaderHome from "../components/seccionesHome/SeccionHeaderHome";
import NavBar from "../components/NavBar";


export default function HomePage() {

  return (
    <div className="bg-black flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 flex flex-col gap-40">
        <SeccionHeaderHome />
        <SeccionSobreNosotros />
        <SeccionArtistas />
        <SeccionGacetaTv />
        <SeccionProximosShows />
        <SeccionGacetaShop />
      </main>
      <FooterGaceta />
    </div> 
  );
}