// src/components/SEO.jsx
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  image, 
  url,
  type = "website" // 'website' o 'profile'
}) {
  
  // Si no pasas estos datos, NO ponemos nada y dejamos 
  // que mande el index.html (así evitamos duplicados).
  // Solo sobreescribimos si hay info nueva.

  const siteTitle = "GACETA";
  const domain = "https://esgaceta.com";

  // Título: Si hay título específico, lo armamos. Si no, undefined (usa el del index.html).
  const metaTitle = title ? `${title} | ${siteTitle}` : undefined;
  
  // URL y Foto completas
  const metaUrl = url ? `${domain}${url}` : undefined;
  const metaImage = image ? (image.startsWith("http") ? image : `${domain}${image}`) : undefined;

  return (
    <Helmet>
      {/* 1. TÍTULO DE LA PESTAÑA (Crucial para navegación) */}
      {metaTitle && <title>{metaTitle}</title>}

      {/* 2. DATOS QUE CAMBIAN SEGÚN LA PÁGINA */}
      {/* Solo renderizamos estas etiquetas si hay un valor nuevo para sobreescribir */}
      
      {description && <meta name="description" content={description} />}
      {metaUrl && <link rel="canonical" href={metaUrl} />}

      {/* Open Graph (Facebook/WhatsApp) */}
      {metaTitle && <meta property="og:title" content={metaTitle} />}
      {description && <meta property="og:description" content={description} />}
      {metaUrl && <meta property="og:url" content={metaUrl} />}
      {metaImage && <meta property="og:image" content={metaImage} />}
      <meta property="og:type" content={type} />

      {/* Twitter */}
      {metaTitle && <meta name="twitter:title" content={metaTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      {metaImage && <meta name="twitter:image" content={metaImage} />}
    </Helmet>
  );
}