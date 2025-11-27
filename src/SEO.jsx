import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image = "/assets/og-image-default.jpg", // Asegurate de tener una imagen por defecto en public/assets
  url 
}) {
  
  const siteTitle = "GACETA";
  const defaultDescription = "Sello independiente y comunidad de artistas del Río de la Plata. Desarrollamos talento, creamos experiencias y construimos cultura.";
  const defaultKeywords = "Gaceta, Sello Discográfico, Trap Argentina, Trap Uruguay, Ramma, Ara, Música Urbana, Videoclips";
  const domain = "https://gaceta.shop"; // Tu dominio real

  const metaTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} — Sello & Comunidad`;
  const metaDescription = description || defaultDescription;
  const metaImage = image.startsWith("http") ? image : `${domain}${image}`;
  const metaUrl = url ? `${domain}${url}` : domain;

  return (
    <Helmet>
      {/* Estándar */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <link rel="canonical" href={metaUrl} />

      {/* Facebook / Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}