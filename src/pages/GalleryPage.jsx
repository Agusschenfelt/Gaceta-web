// GalleryPage.jsx
import "swiper/css";
import "swiper/css/navigation";
import GacetaGallery from "../components/Pagina-Gallery/GacetaGallery.jsx";
import { GACETA_GALLERY_ITEMS } from "../data/gacetaGalleryItems.js";
import SEO from "../SEO.jsx";
import TransitionLink from "../components/TransitionLink.jsx";


export default function GalleryPage() {
  return (
    <section>
      <SEO
        title="Gallery"
        description="Archivo visual de Gaceta. Fotografía analógica, digital y cobertura exclusiva de nuestros shows y rodajes."
        url="/gallery"
      />
      <GacetaGallery
        items={GACETA_GALLERY_ITEMS}
        title="GALLERY"
        density="tobacco"     // más chico = más volumen
        overlapTitle        // que las cards suban y "invadan" el título
        chaos               // activa layout aleatorio tipo Tobacco
        seed={20251011}     // para reproducibilidad; cambiá el número para variar
      />

      {/* Exit CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-24 px-6 border-t border-white/5">
        <TransitionLink
          to="/artistas"
          className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-[background-color,color,border-color] duration-300 uppercase tracking-widest text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
        >
          Ver Roster
        </TransitionLink>
        <TransitionLink
          to="/"
          className="px-8 py-3 rounded-full border border-transparent text-white/40 hover:text-white transition-[color] duration-300 uppercase tracking-widest text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
        >
          Inicio
        </TransitionLink>
      </div>

    </section>
  );
}
