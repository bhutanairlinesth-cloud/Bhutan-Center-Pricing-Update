@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "IBM Plex Sans Thai", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "IBM Plex Sans Thai", "Inter", sans-serif;
  --font-serif: "Playfair Display", "IBM Plex Sans Thai", serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  --color-brand-emerald: #064e3b;
  --color-brand-emerald-light: #0f766e;
  --color-brand-gold: #c9992e;
  --color-brand-gold-light: #f2cf73;
  --color-brand-gold-dark: #8a661c;
  --color-brand-cream: #f7f8f5;
}

:root {
  color-scheme: light;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 0%, rgba(201, 153, 46, .08), transparent 26rem),
    radial-gradient(circle at 100% 20%, rgba(6, 78, 59, .07), transparent 30rem),
    #f7f8f5;
}
button, input, select, textarea { font: inherit; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 3px solid rgba(15, 118, 110, .2);
  outline-offset: 2px;
}

.premium-shadow {
  box-shadow: 0 10px 30px -18px rgba(6, 78, 59, .34), 0 2px 8px rgba(15, 23, 42, .04);
}
.premium-shadow-lg {
  box-shadow: 0 28px 70px -28px rgba(6, 78, 59, .38), 0 10px 24px -16px rgba(15, 23, 42, .18);
}
.gold-border-gradient { border-image: linear-gradient(90deg, #c9992e, #f2cf73, #8a661c) 1; }

/* Unify cards generated throughout the app */
.rounded-2xl, .rounded-3xl { backdrop-filter: saturate(115%); }
.bg-white { --tw-bg-opacity: .98; }

table { border-collapse: separate; border-spacing: 0; }
thead th { white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }

/* Better mobile behavior for large data tables */
@media (max-width: 767px) {
  main { padding-left: 1rem !important; padding-right: 1rem !important; }
  table { min-width: 760px; }
  .premium-shadow-lg { box-shadow: 0 16px 45px -24px rgba(6, 78, 59, .38); }
}

/* Gentle motion without distracting users */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes scale-up { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
.animate-fade-in { animation: fade-in .18s ease-out both; }
.animate-scale-up { animation: scale-up .22s ease-out both; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; border: 2px solid transparent; background-clip: content-box; }
