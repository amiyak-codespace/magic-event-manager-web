import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
  keywords?: string;
}

const BASE_URL = 'https://host-events.appsmagic.in';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESC = 'AppsMagic Events helps you host, manage, and grow events with RSVP, ticketing, check-in, and analytics.';
const DEFAULT_KEYWORDS = 'AppsMagic Events, event management platform, event hosting software, RSVP management, ticketing platform India';

export function SEO({
  title = 'AppsMagic Events',
  description = DEFAULT_DESC,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  keywords = DEFAULT_KEYWORDS,
}: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title.includes('AppsMagic Events') ? title : `${title} | AppsMagic Events`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="AppsMagic Events" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
