/**
 * The last-resort page for server errors. It has to be fully self-contained
 * (no bundled CSS, no React, no fonts) because it's returned precisely when
 * the app itself failed to render — so it repeats the site's own colours and
 * picks the visitor's language with a few lines of inline script.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <title>KANOY</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      body { font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; background: oklch(0.15 0.014 235); color: oklch(0.98 0.004 200); display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; }
      .card { max-width: 28rem; width: 100%; }
      .mark { font-size: 1.6rem; font-weight: 500; letter-spacing: -0.01em; color: oklch(0.74 0.13 195); margin: 0 0 2rem; }
      h1 { font-size: 1.6rem; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 1rem; }
      p { color: oklch(0.72 0.02 220); margin: 0 0 2.25rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.9rem 1.6rem; border-radius: 2px; font: inherit; font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: oklch(0.74 0.13 195); color: oklch(0.16 0.012 240); }
      .secondary { background: transparent; color: inherit; border-color: rgba(255, 255, 255, 0.2); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark">Kanoy</div>
      <h1 id="title">Algo correu mal</h1>
      <p id="text">Não foi possível carregar esta página. Tente novamente ou volte ao início.</p>
      <div class="actions">
        <button class="secondary" id="retry" onclick="location.reload()">Tentar novamente</button>
        <a class="primary" id="home" href="/">Voltar ao início</a>
      </div>
    </div>
    <script>
      (function () {
        var copy = {
          es: ["Algo ha salido mal", "No se ha podido cargar esta página. Inténtalo de nuevo o vuelve al inicio.", "Intentar de nuevo", "Volver al inicio"],
          en: ["Something went wrong", "This page couldn't be loaded. Try again, or head back to the start.", "Try again", "Back to home"]
        };
        var lang = "pt";
        try { lang = localStorage.getItem("kanoy-lang") || ""; } catch (e) {}
        if (lang !== "es" && lang !== "en" && lang !== "pt") {
          var n = ((navigator.languages && navigator.languages[0]) || navigator.language || "pt").slice(0, 2).toLowerCase();
          lang = n === "es" || n === "en" ? n : "pt";
        }
        var c = copy[lang];
        if (!c) return;
        document.documentElement.lang = lang;
        document.getElementById("title").textContent = c[0];
        document.getElementById("text").textContent = c[1];
        document.getElementById("retry").textContent = c[2];
        document.getElementById("home").textContent = c[3];
      })();
    </script>
  </body>
</html>`;
}
