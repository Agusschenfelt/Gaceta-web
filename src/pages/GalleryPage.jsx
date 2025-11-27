// GalleryPage.jsx
import GacetaGallery from "../components/Pagina-Gallery/GacetaGallery.jsx";
import { GACETA_GALLERY_ITEMS } from "../../src/data/gacetaGalleryItems.js";
import SEO from "../SEO.jsx";


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
        overlapTitle        // que las cards suban y “invadan” el título
        chaos               // activa layout aleatorio tipo Tobacco
        seed={20251011}     // para reproducibilidad; cambiá el número para variar
      />

    </section>
  );
}
