import SeccionGacetaShop from "../components/seccionesHome/SeccionGacetaShop";
import SeccionProximosShows from "../components/seccionesHome/SeccionProximosShows";
import SeccionGacetaTv from "../components/seccionesHome/SeccionGacetaTv";
import SeccionArtistas from "../components/seccionesHome/SeccionArtistas";
import SeccionSobreNosotros from "../components/seccionesHome/SeccionSobreNosotros";
import SeccionHeaderHome from "../components/seccionesHome/SeccionHeaderHome";


export default function HomePage() {

  return (
    <div className="bg-black flex flex-col min-h-screen gap-48">
        <SeccionHeaderHome />
        <SeccionSobreNosotros />
        <SeccionArtistas />
        <SeccionGacetaTv />
        <SeccionProximosShows />
        <SeccionGacetaShop />
    </div> 
  );
}