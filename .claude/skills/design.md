# Skill: Design System — GACETA Web

## Identidad Visual

GACETA es un sello discográfico urbano independiente argentino. La web es una experiencia, no una landing.
La estética se basa en: editorial urbano, blanco y negro con color estratégico, tipografía bold de impacto.

**Referencias visuales**: Supreme, A-COLD-WALL*, sellos de rap argentino, revistas de música underground.

---

## Paleta de Colores

```css
:root {
  /* Base */
  --color-black: #0a0a0a;       /* Negro profundo, no puro */
  --color-white: #f5f5f5;       /* Blanco roto, no puro */
  --color-gray-dark: #1a1a1a;   /* Fondos de secciones alternadas */
  --color-gray-mid: #333333;    /* Bordes, divisores */
  --color-gray-light: #888888;  /* Textos secundarios */

  /* Acento — usar con criterio, nunca decorativamente */
  --color-accent: #7c3aed;      /* Violeta/morado — momentos de impacto */
  --color-accent-alt: #ffffff;  /* Blanco como acento sobre negro */

  /* Fondos */
  --bg-primary: var(--color-black);
  --bg-secondary: var(--color-gray-dark);
}
```

**Regla de uso del color**: El color de acento (violeta) solo para highlights, CTAs principales, o momentos editoriales específicos. El resto: blanco y negro.

---

## Tipografía

El sistema tipográfico es lo más importante de GACETA. Bold, condensada, de impacto.

```css
/* Títulos display — grandes, bold, condensados */
.text-display {
  font-size: clamp(3rem, 10vw, 9rem);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

/* Títulos de sección */
.text-heading {
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

/* Labels / etiquetas editoriales */
.text-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* Cuerpo */
.text-body {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
}
```

**Jerarquía en pantalla**: El tamaño del título display debe ser lo suficientemente grande para que ocupe la mayoría del ancho de pantalla. Si se ve pequeño, es muy pequeño.

---

## Espaciado y Layout

```css
/* Sistema de espaciado — múltiplos de 8px */
--space-xs: 0.5rem;    /* 8px */
--space-sm: 1rem;      /* 16px */
--space-md: 1.5rem;    /* 24px */
--space-lg: 2.5rem;    /* 40px */
--space-xl: 4rem;      /* 64px */
--space-2xl: 6rem;     /* 96px */
--space-3xl: 10rem;    /* 160px */

/* Padding lateral de página */
--page-padding: clamp(1.25rem, 5vw, 4rem);
```

**Secciones**: Cada sección del home debe tener su propio ritmo. Alternar entre secciones densas (mucho contenido) y secciones de respiro (mucho espacio negativo).

---

## Componentes UI

### Botones
```jsx
// CTA principal
<button className="
  px-8 py-3 
  bg-white text-black 
  text-sm font-semibold tracking-widest uppercase
  hover:bg-accent hover:text-white
  transition-colors duration-300
">
  Ver más
</button>

// CTA secundario / ghost
<button className="
  px-8 py-3 
  border border-white text-white
  text-sm font-semibold tracking-widest uppercase
  hover:bg-white hover:text-black
  transition-colors duration-300
">
  Explorar
</button>
```

### Labels editoriales
```jsx
// Para categorías, fechas, metadatos
<span className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400">
  ⊳ GACETA
</span>
```

### Separadores
```jsx
// Línea fina, no un <hr> genérico
<div className="w-full h-px bg-white/10 my-16" />
```

### Hover en imágenes
```css
/* Overlay sutil, no intrusivo */
.imagen-container {
  overflow: hidden;
  position: relative;
}

.imagen-container img {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.imagen-container:hover img {
  transform: scale(1.04);
}
```

---

## Grid y Composición

```jsx
/* Grid editorial — romper la cuadrícula intencionalmente */

// Galería con offset (no todas las columnas alineadas)
<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
  <div className="col-span-1 md:mt-12">...</div>  {/* offset */}
  <div className="col-span-1">...</div>
  <div className="col-span-1 md:col-span-1">...</div>
</div>

// Texto que rompe el margen
<h1 className="-mx-4 md:-mx-8 text-display">GACETA</h1>
```

---

## Mobile

- Touch targets mínimo 44x44px
- El reproductor en mobile debe ser siempre visible y accesible con el pulgar
- Títulos en mobile: nunca más de 2 líneas si son display
- Imágenes: aspect-ratio fijo para evitar layout shift
- Menú: overlay fullscreen, no drawer lateral

---

## Lo que NO hacer

- No usar sombras decorativas (box-shadow innecesario)
- No usar border-radius grande en elementos editoriales (máximo 4px, preferir 0)
- No centrar texto en bloques largos (alineación izquierda)
- No agregar iconos innecesarios (solo el logo/marca de GACETA)
- No usar colores intermedios o pasteles
- No usar más de 2 pesos tipográficos por vista
