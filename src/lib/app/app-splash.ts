import { useLayoutEffect } from "react";

/**
 * Critical CSS for the installed phone/tablet app's launch, inlined at the
 * top of <head> (routes/__root.tsx) instead of living in styles.css: an
 * external stylesheet arrives a moment after the HTML, and in that gap iOS
 * paints the unstyled page — a white flash between its dark launch and ours.
 * Inline, the dark background and the launch screen apply on the very first
 * frame. Literal colours only (the CSS variables aren't loaded yet), and
 * only for the installed touch app: browsers and desktop never match.
 */
export const APP_SPLASH_CSS = `
#app-splash { display: none; }
@media (display-mode: standalone) and (pointer: coarse) {
  html, body { background-color: #060c10; }
  html:not([data-app-ready]) #app-splash,
  html[data-app-splash-hold] #app-splash {
    position: fixed; inset: 0; z-index: 200;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem;
    background:
      radial-gradient(90% 55% at 0% 0%, rgba(0, 196, 196, 0.16), transparent 70%),
      linear-gradient(to bottom, #07131c, #04080b);
    animation: app-splash-giveup 0s linear 10s forwards;
  }
  #app-splash img {
    width: 5.5rem; height: auto;
    filter: drop-shadow(0 0 24px rgba(0, 196, 196, 0.45));
  }
  #app-splash .app-splash-bar {
    position: relative; width: 8rem; height: 3px; overflow: hidden;
    border-radius: 999px; background: rgba(255, 255, 255, 0.1);
  }
  #app-splash .app-splash-bar::after {
    content: ""; position: absolute; inset: 0 auto 0 0; width: 40%;
    border-radius: inherit; background: #00c4c4; box-shadow: 0 0 8px #00c4c4;
    animation: app-splash-load 1.1s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    #app-splash .app-splash-bar::after { animation: none; width: 100%; opacity: 0.6; }
  }
  /* iOS 26 blurs the top of the page under the status bar unless it finds a
     sticky/fixed bar there, whose colour it then extends instead. */
  .app-topbar { position: sticky; top: 0; z-index: 30; background-color: var(--studio); }
}
@keyframes app-splash-load { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
@keyframes app-splash-giveup { to { visibility: hidden; } }
`;

/**
 * Keeps the launch screen up while `active` (installed app only — elsewhere
 * #app-splash never shows): a page's first load stays on the same K-and-bar
 * screen the app opened on, instead of a second, different loading state
 * after it. Also brings it back after unlocking, until that page has its
 * data. A layout effect, so the page's own placeholder never paints first.
 * The 10 s give-up in the CSS still applies.
 */
export function useHoldAppSplash(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    holds += 1;
    root.dataset["appSplashHold"] = "1";
    return () => {
      holds -= 1;
      if (holds === 0) delete root.dataset["appSplashHold"];
    };
  }, [active]);
}

let holds = 0;
