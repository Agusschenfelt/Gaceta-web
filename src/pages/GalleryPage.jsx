// GalleryPage.jsx
import GacetaGallery from "../components/Pagina-Gallery/GacetaGallery.jsx";
import { GACETA_GALLERY_ITEMS } from "../../src/data/gacetaGalleryItems.js";


export default function GalleryPage() {
  return (
    <section>
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
