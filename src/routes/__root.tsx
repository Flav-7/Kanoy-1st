import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "../lib/i18n/LanguageContext";
import { DEFAULT_LANGUAGE, translations } from "../lib/i18n/translations";
import { ErrorScreen } from "../components/kanoy/ErrorScreen";
import { CookieConsent } from "../components/kanoy/CookieConsent";

function NotFoundComponent() {
  return <ErrorScreen kind="notFound" />;
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorScreen
      kind="error"
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

// What the server (and link-preview scrapers) see: the default language.
const seo = translations[DEFAULT_LANGUAGE].seo;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: seo.title },
      { name: "description", content: seo.description },
      { name: "author", content: "KANOY" },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://kanoy.pt/og-image.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://kanoy.pt/og-image.webp" },
    ],
    links: [
      // Fonts are self-hosted in src/styles.css (@font-face) — see that file
      // for why: this used to be a render-blocking fonts.googleapis.com link.
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "KANOY",
  url: "https://kanoy.pt",
  logo: "https://kanoy.pt/og-image.webp",
  image: "https://kanoy.pt/og-image.webp",
  description: seo.description,
  email: "hello@kanoy.studio",
  telephone: "+351923250729",
  sameAs: ["https://www.instagram.com/kanoy.pt/"],
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <CookieConsent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
