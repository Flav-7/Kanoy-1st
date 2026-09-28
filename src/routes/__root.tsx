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
import { AuthProvider } from "../lib/auth/AuthContext";
import { DEFAULT_LANGUAGE, translations } from "../lib/i18n/translations";
import { ErrorScreen } from "../components/kanoy/ErrorScreen";
import { CookieConsent } from "../components/kanoy/CookieConsent";
import { ConsentedAnalytics } from "../components/kanoy/ConsentedAnalytics";
import { AppLockGate } from "../components/app/AppLockGate";
import { APP_SPLASH_CSS } from "../lib/app/app-splash";

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

/**
 * iPhone launch images (public/splash): iOS shows the matching one while the
 * installed app starts, instead of its own black-then-white screen, and our
 * #app-splash takes over with the same picture. [CSS width, height, pixel
 * ratio] per screen size; iOS reads these when the app is added to the home
 * screen.
 */
const IOS_SCREENS: [number, number, number][] = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [375, 667, 2],
  [320, 568, 2],
];
const IOS_STARTUP_IMAGES = IOS_SCREENS.map(([w, h, r]) => ({
  rel: "apple-touch-startup-image",
  href: `/splash/splash-${w * r}x${h * r}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
}));

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
      // Installable app (PWA) — see public/manifest.webmanifest and public/sw.js.
      { name: "theme-color", content: "#060c10" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "KANOY" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    links: [
      // Fonts are self-hosted in src/styles.css (@font-face) — see that file
      // for why: this used to be a render-blocking fonts.googleapis.com link.
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      // Google's result favicon wants a square image in multiples of 48px.
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "512x512" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      ...IOS_STARTUP_IMAGES,
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
  // Square logo for Google (the og-image is a wide share card).
  logo: "https://kanoy.pt/icon-512.png",
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
        {/* First in <head>: the installed app's launch styles must not wait
            for the stylesheet (see lib/app/app-splash.ts). */}
        <style id="app-splash-css" dangerouslySetInnerHTML={{ __html: APP_SPLASH_CSS }} />
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </head>
      <body>
        {/* Launch screen of the installed phone/tablet app. Server-rendered and
            shown purely by CSS (styles.css, #app-splash), so it's there from
            the very first paint — before any JavaScript — and the site never
            flashes by. Hidden everywhere else (browsers, desktop). AuthProvider
            removes it once it knows whether to show the sign-in, the lock or
            the unlocked site. */}
        <div id="app-splash" aria-hidden="true">
          <img src="/favicon.png" alt="" width={512} height={512} />
          <span className="app-splash-bar" />
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Production only: in dev a service worker would cache Vite's modules and fight HMR.
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <CookieConsent />
          <ConsentedAnalytics />
          <AppLockGate />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
