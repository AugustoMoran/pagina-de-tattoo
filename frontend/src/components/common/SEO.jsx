import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = import.meta.env.VITE_STORE_NAME || 'MDFK Tattoo';
const DEFAULT_DESCRIPTION =
  'Estudio de tatuajes MDFK Tattoo. Portfolio, insumos profesionales y turnos con seña.';
const DEFAULT_TITLE = 'MDFK Tattoo | Estudio · Portfolio · Insumos · Turnos';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  type = 'website',
  image,
  keywords,
  schemaData,
  noindex = false,
}) => {
  const fullTitle = !title
    ? DEFAULT_TITLE
    : /mdfk/i.test(title)
      ? title
      : `${title} | ${SITE_NAME}`;

  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultImage = `${origin}/logo.jpg`;
  const metaImage = image || defaultImage;

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:locale" content="es_AR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />

      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {schemaData && (
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
