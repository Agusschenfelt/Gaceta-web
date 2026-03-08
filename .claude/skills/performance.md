# Skill: Performance — GACETA Web

## Stack: React + Tailwind + GSAP + Lenis

---

## Auditoría Antes de Optimizar

Antes de cualquier cambio, revisar:
```bash
# Analizar bundle size
npm run build -- --analyze

# Lighthouse en modo producción (nunca en dev)
npx lighthouse http://localhost:4173 --view
```

Métricas objetivo:
- LCP < 2.5s
- FID / INP < 100ms
- CLS < 0.1
- TBT < 200ms

---

## React

### Code Splitting
```jsx
// Cada página lazy por defecto
const Galeria = lazy(() => import('./pages/Galeria'))
const Nosotros = lazy(() => import('./pages/Nosotros'))

// Componentes pesados también
const MusicPlayer = lazy(() => import('./components/MusicPlayer'))
```

### Evitar re-renders innecesarios
```jsx
// Memorizar componentes que reciben las mismas props
const ArtistCard = memo(({ name, image }) => { ... })

// Estabilizar callbacks
const handlePlay = useCallback(() => { ... }, [deps])

// Valores computados costosos
const sortedTracks = useMemo(() => tracks.sort(...), [tracks])
```

### Estado del reproductor
- El reproductor debe vivir en un Context a nivel raíz
- Nunca pasar el estado del reproductor via prop drilling
- Usar `useRef` para la instancia de Audio, no useState

---

## Imágenes

### Formato y tamaño
- Convertir todas las imágenes a **WebP** (70-80% menos peso)
- Usar srcset para diferentes tamaños de pantalla
- Máximo 1200px de ancho para imágenes de galería en desktop

```jsx
// Componente imagen optimizada
const OptimizedImage = ({ src, alt, className }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    loading="lazy"
    decoding="async"
  />
)
```

### Conversión batch a WebP
```bash
# Con sharp (Node)
npx sharp-cli --input "public/images/**/*.{jpg,png}" --output "public/images/" --format webp

# Con cwebp
for f in public/images/*.jpg; do cwebp "$f" -o "${f%.jpg}.webp"; done
```

### Galería
- Implementar virtualización si hay más de 20 fotos (react-virtual o similar)
- Lazy load con Intersection Observer nativo, no librería
- Placeholder blur hash o color dominante mientras carga

---

## GSAP

### Cleanup obligatorio en useEffect
```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.elemento', { opacity: 0, y: 30, duration: 0.8 })
  }, containerRef)

  return () => ctx.revert() // SIEMPRE limpiar
}, [])
```

### ScrollTrigger
```jsx
// Usar scrub con moderación — es costoso en mobile
ScrollTrigger.create({
  trigger: '.seccion',
  start: 'top 80%',
  onEnter: () => gsap.to('.seccion', { opacity: 1 }),
  // scrub: true  <- solo si es indispensable para el efecto
})

// Refresh solo cuando cambia el layout
ScrollTrigger.refresh()
```

### Reducir trabajo en el hilo principal
- Animar solo `transform` y `opacity` — nunca `width`, `height`, `top`, `left`
- Usar `will-change: transform` solo en elementos que realmente animan
- Desactivar animaciones complejas en mobile si afectan performance

```jsx
const isMobile = window.innerWidth < 768
gsap.to('.hero-text', {
  y: isMobile ? 0 : -50, // Parallax solo en desktop
  scrollTrigger: { ... }
})
```

---

## Lenis

### Configuración óptima
```js
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  // wheelMultiplier: 1, // Ajustar si se siente raro en trackpad
})

// Conectar con GSAP ticker — no usar requestAnimationFrame propio
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

### Pausar Lenis durante modales/overlays
```js
// Cuando se abre algo que no debe scrollear
lenis.stop()

// Al cerrar
lenis.start()
```

---

## Fuentes

```html
<!-- Preload de fuentes críticas -->
<link rel="preload" href="/fonts/font-bold.woff2" as="font" type="font/woff2" crossorigin>

<!-- Display swap para no bloquear render -->
@font-face {
  font-family: 'MiFuente';
  src: url('/fonts/font-bold.woff2') format('woff2');
  font-display: swap;
}
```

---

## Vite (si aplica)

```js
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          lenis: ['lenis'],
          vendor: ['react', 'react-dom'],
        }
      }
    }
  }
}
```

---

## Checklist de Performance

- [ ] Todas las imágenes en WebP
- [ ] Lazy loading en imágenes fuera del viewport inicial
- [ ] Code splitting por ruta
- [ ] GSAP contexts con cleanup
- [ ] Fuentes con preload + font-display: swap
- [ ] ScrollTrigger sin scrub en mobile
- [ ] Bundle analizado — ningún chunk > 500kb
- [ ] Lighthouse > 80 en producción
