import type { Metadata } from "next";

export const SITE_NAME = "Coopérative Plus";
export const SITE_URL = new URL("https://www.coop-plus.site");
export const DEFAULT_DESCRIPTION =
  "Comparez les départs de taxi-brousse à Madagascar, choisissez votre siège et réservez votre trajet en ligne simplement.";

const SOCIAL_IMAGE = {
  url: "/hero.png",
  width: 1376,
  height: 768,
  alt: "Un autocar sur la route avec Coopérative Plus",
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  if (noIndex) {
    return {
      title,
      description,
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
    };
  }

  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "fr-MG": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "fr_MG",
      type: "website",
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL.origin}/#organization`,
      name: SITE_NAME,
      url: SITE_URL.origin,
      logo: absoluteUrl("/logo-round.png"),
      email: "tsiresymila@gmail.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Antananarivo",
        addressCountry: "MG",
      },
      areaServed: {
        "@type": "Country",
        name: "Madagascar",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL.origin}/#website`,
      url: SITE_URL.origin,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "fr-MG",
      publisher: { "@id": `${SITE_URL.origin}/#organization` },
    },
  ],
};
