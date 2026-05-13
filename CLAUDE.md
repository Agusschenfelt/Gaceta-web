# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sitio Web Oficial — GACETA (@esgaceta)

Sitio web del sello discográfico GACETA. El objetivo es que sea una **experiencia**, no solo una página. Está en producción. El foco es pulirla y elevarla sin cambiar la identidad visual establecida.

---

## Comandos

```bash
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # Build de producción
npm run preview    # Vista previa del build
npm run lint       # ESLint
```

> **Importante:** al instalar deps siempre usar `--legacy-peer-deps` por conflictos de peer deps.

---

## Stack

- **React 19** + **Vite 7**
- **Tailwind CSS 3** — tokens via CSS variables mapeados en `tailwind.config.js`
- **GSAP 3.13** + `@gsap/react` — ScrollTrigger, SplitText, ScrollToPlugin
- **Lenis** (`@studio-freight/lenis`) — smooth scroll, integrado con GSAP ticker
- **React Router v7**
- **Swiper 11** — solo en `/gallery` (chunk separado)
- **Vercel Analytics + Speed Insights**

---

## Rutas

| Path | Página |
|---|---|
| `/` | `HomePage` |
| `/artistas` | `RosterPage` |
| `/artistas/:id` | `ArtistPage` |
| `/sobre-nosotros` | `SobreNosotrosPage` |
| `/gallery` | `GalleryPage` |

Todas las páginas son **lazy** (`lazy()` + `<Suspense>`). Cualquier ruta no reconocida redirige a `/`.

---

## Arquitectura de Providers (árbol de wrappers en App.jsx)

```
<MenuProvider>           — Context para estado abierto/cerrado del menú (useMenu())
  <PageTransitionProvider>  — GSAP curtain transition; expone navigateWithTransition() y goBack()
    <SmoothScroll>       — Instancia Lenis, conectada al ticker de GSAP
      <Routes>
        <Layout>         — Navbar + Outlet + Footer + NoiseOverlay
          <Page />
        </Layout>
      </Routes>
      <MusicPlayer />    — Estado local (sin Context); shuffle nativo; solo desktop visible
    </SmoothScroll>
  </PageTransitionProvider>
```

**Utilidades de ruta que renderizan `null`:**
- `ScrollToTopOnRouteChange` — scroll al top en cada navegación
- `ResetBgOnRoute` — mata ScrollTriggers sobre `<html>` y resetea `--pageBg` a `#0e0e10`
- `ScrollToAnchor` — navega a anchor `#hash` después de route change

---

## Reglas de GSAP (crítico)

- `gsap.registerPlugin(...)` **solo en `App.jsx`** — no repetir en componentes individuales.
- Usar `useGSAP` con `{ scope: containerRef }` para animar dentro de un componente.
- Siempre incluir `ctx.revert()` en el cleanup de `useGSAP`.
- `ScrollTrigger.config({ ignoreMobileResize: true })` está configurado globalmente.

---

## Navegación con transición

Usar `<TransitionLink to="/ruta">` en lugar de `<Link>` de React Router para activar el curtain animado de GSAP. El hook `usePageTransition()` expone `navigateWithTransition(to, label?)` y `goBack()` para navegación programática.

---

## Identidad Visual (NO romper)

- **Color de acento:** `#dee5a0` (amarillo-verde "acid gold") — mapeado como `bg-secundario` / `text-secundario` en Tailwind. No es violeta.
- **Fondo:** `#0a0a0a` (`bg-fondo`). Animable via CSS variable `--pageBg`.
- **Tipografía:** Inter (display, bold, tracking tight) + Instrument Serif (italic, contraste editorial).
- **Paleta:** blanco y negro como base; el acento `secundario` solo para momentos de impacto.
- No usar gradientes genéricos ni colores pastel.
- Mobile-first en todas las decisiones.

---

## Chunks de build (vite.config.js)

```
vendor      — react, react-dom, react-router-dom
animations  — gsap, @gsap/react
icons       — lucide-react
brandIcons  — react-icons
gallery     — swiper (solo carga en /gallery)
```

`artistsData.js` se importa directamente en `ArtistPage` para que Vite lo extraiga como chunk compartido sin incluirlo en el bundle principal.

---

## Datos

- `src/data/tracks.js` — 22 tracks para el MusicPlayer (title, artist, src, cover)
- `src/data/artistsData.js` — data de artistas (slug, nombre, releases, bio, fotos, video)
- `src/data/showsData.js` — shows próximos; se ordenan ascendente (próximos primero, mystery al final)
- `src/data/gacetaGalleryItems.js` — items para la galería Swiper

---

## Patrones importantes

- **`matchMedia` para breakpoints en JS** — no usar `window.addEventListener('resize', ...)`. Usar `window.matchMedia(...).addEventListener('change', handler)`.
- **Noise texture** — definida como clase CSS `.noise-texture` en `index.css` (inline SVG). No usar assets externos.
- **Fondo animable** — algunos ScrollTriggers animan `--pageBg` en `<html>`. `ResetBgOnRoute` lo limpia en cada navegación.
- **`data-lenis-prevent`** — agregar en contenedores con scroll interno para evitar conflicto con Lenis.
- **`prefers-reduced-motion`** — global en `index.css`; anula duraciones a `0.01ms`.

---

## Lo que NO hacer

- No reescribir componentes enteros sin razón
- No cambiar la identidad visual establecida
- No agregar dependencias sin justificarlo
- No llamar `gsap.registerPlugin()` fuera de `App.jsx`
- No romper el MusicPlayer (estado local, no hay Context)
- No usar `framer-motion` (fue eliminado intencionalmente)
- No usar `split-type` (reemplazado por `gsap/SplitText`)
