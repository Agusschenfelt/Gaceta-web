# GACETA - Design System & Branding Guidelines

This document outlines the design language, styling conventions, and branding vibe for the **Gaceta** web project. It is intended to serve as a reference for maintaining a cohesive visual identity across portfolio sections and future features.

## 1. Brand Identity & "Vibe"
**Gaceta** is an independent record label and community of artists from the Río de la Plata region (Trap Argentina & Uruguay, Música Urbana).
- **Keywords:** Disruptivo, flashero, cinematográfico, urbano, oscuro, premium.
- **Visual Style:** Dark mode by default, high-contrast text, 3D interactive elements, smooth cinematic animations, and a subtle "raw/analog" aesthetic with noise textures.

## 2. Color Palette
The project uses Tailwind custom variables defined in `index.css` and `tailwind.config.js`.

- **Fondo (Background):** `#0a0a0a` - Very dark gray/almost black for the overall cinematic feel.
- **Primario (Primary):** `#1e40af` - Deep blue.
- **Secundario (Secondary / "Acid Gold"):** `#dee5a0` - A muted, acid-like pale gold/yellow used for accents, focus states, and highlighting.
- **Rojo (Red):** `#911e1e` - Deep red for alerts or aggressive contrast points.
- **Texto (Text):** `#ededed` - Off-white for general typography.
- **Texto Secundario:** `#ffffff` with `0.7` opacity.

*Note: The background is animable via the `--pageBg` CSS variable and `.bg-page` class.*

## 3. Typography
The project uses two Google Fonts to create a modern brutalist/elegant contrast.

### Font Families
- **Inter (`font-inter`):** Primary font for body text, headers, and UI elements.
  - Weights: `300`, `400`, `500`, `600`, `700`, `900`.
- **Instrument Serif (`font-instrument`):** Secondary display font used for elegant italicized accents.
  - Weights: `italic` only.

### Typographic Classes (`index.css`)
- `.titulo`: Used for massive, impactful headlines. Uses Inter (`font-weight: 600`), negative letter-spacing (`-0.06em`), and tight line-height (`0.85`). Responsive scaling goes from `3.5rem` on mobile up to `9rem` on extra-large desktops.
- `.subtitulo`: Used for contrast beneath titles. Uses Inter (`font-weight: 300`), slight negative tracking, and `opacity: 0.7`.
- `.cursiva` / `.font-serif-display`: Uses Instrument Serif, italicized, for elegant contrast words within bold titles.

## 4. Visual Effects & Texture
- **Global Noise Texture:** A subtle SVG fractal noise texture is applied globally over the `body` background (opacity 0.05) to give it a raw, film-like grain. There is also a `.noise-texture` class for localized use.
- **Focus Rings:** Accessible keyboard navigation uses an outline of `2px solid var(--color-secundario)` (`#dee5a0`).
- **Text Glow:** The `.text-glow` class applies a pulsing text-shadow animation (useful for neon-like emphasis on text).
- **Mask Fades:** `.mask-fade-edges` applies a CSS linear-gradient mask to smoothly fade the top and bottom edges of elements (great for scrolling lists or images).

## 5. Motion & Interaction (The "Flashero" Feel)
Animations and transitions are a core part of the Gaceta experience.

- **GSAP:** Heavy use of GSAP (`ScrollTrigger`, `SplitText`, `ScrollToPlugin`, `@gsap/react`) for complex, scroll-linked animations, text reveals, and page transitions.
- **Lenis Smooth Scroll:** Integrated globally to ensure buttery smooth scrolling mechanics (`html.lenis`).
- **Page Transitions:** Handled via a custom `PageTransitionProvider`. Background colors and routes crossfade cinematically.
- **Custom Cursor:** A global custom cursor component (`CustomCursor.jsx`) overrides the default browser pointer to enhance the immersive feel.
- **3D & Interactive Elements:** Components like `Merch3DCard.jsx` and `InteractiveBackground.jsx` bring depth to the UI.
- **CSS Animations:**
  - `.gallery-img`: Pure CSS fade-in `galleryCardIn`.
  - `.gallery-fade-up`: Staggered CSS translation `galleryFadeUp` using `--anim-delay`.
  - `@keyframes playingBar`: Used for the active music player visualizer.

## 6. Layout & Utilities
- **Framework:** React + Vite + Tailwind CSS.
- **Mobile Viewport Fix:** Uses `.h-full-screen` (`height: 100svh`) to prevent layout jumps on mobile browsers when the address bar hides/shows.
- **Music Player padding:** On mobile (`max-width: 767px`), the body has a bottom padding of `4rem` to prevent content from hiding behind the persistent fixed music player.
- **Custom Scrollbar:** The Webkit scrollbar is styled to blend with the dark theme (Track `#0a0a0a`, Thumb `#333`).

## 7. Implementation Checklist for New Sections
1. **Wrapper:** Ensure the section uses the dark background (`bg-fondo`) or the animable `bg-page` class.
2. **Typography:** Mix `.titulo` and `.cursiva` to create the signature Gaceta headline contrast.
3. **Animations:** Wrap new components in GSAP ScrollTriggers or use CSS entry animations. Always respect `prefers-reduced-motion`.
4. **Accents:** Use the acid gold (`secundario`) sparingly for calls to action, active states, or hover effects.
