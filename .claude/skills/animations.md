# Skill: Animaciones — GACETA Web

## Stack: GSAP + Lenis + React

---

## Principios

Las animaciones de GACETA deben sentirse como el sello:
- **Intencionales**: cada animación tiene un propósito narrativo
- **Directas**: sin rebotes innecesarios, sin efectos genéricos
- **Rápidas**: duraciones cortas en UI (0.3-0.6s), largas solo en hero/entradas
- **Sutiles en mobile**: reducir o eliminar parallax y efectos de scroll en pantallas chicas

Nunca usar:
- Bounce easing en elementos editoriales
- Rotaciones sin propósito
- Animaciones que bloqueen el scroll
- Efectos que compitan con el contenido fotográfico

---

## Easings del Proyecto

```js
// Definir una vez, usar en todo el proyecto
export const ease = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  sharp: 'power3.out',        // Entradas de texto bold
  smooth: 'expo.out',         // Transiciones de página
  snap: 'back.out(1.2)',      // Solo para elementos pequeños de UI
}
```

---

## Patrones de Animación

### Entrada de texto editorial (hero, títulos grandes)
```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.titulo-hero', {
      y: '110%',
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      delay: 0.2,
    })
  }, ref)
  return () => ctx.revert()
}, [])
```

> Tip: Para el efecto "texto que sube desde abajo", envolver cada línea en un div con `overflow: hidden`.

### Fade in al hacer scroll
```jsx
gsap.from(elementos, {
  opacity: 0,
  y: 24,
  duration: 0.7,
  ease: 'power2.out',
  stagger: 0.1,
  scrollTrigger: {
    trigger: contenedor,
    start: 'top 82%',
    once: true, // No repetir al hacer scroll up
  }
})
```

### Imagen con reveal (cortina)
```jsx
// Estructura: <div className="overflow-hidden"><img /></div>
gsap.from(imagen, {
  scale: 1.08,
  duration: 1.1,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: imagen,
    start: 'top 85%',
    once: true,
  }
})
```

### Parallax sutil (solo desktop)
```jsx
const mm = gsap.matchMedia()
mm.add('(min-width: 768px)', () => {
  gsap.to(imagenFondo, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: seccion,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
    }
  })
})
```

### Transición de página
```jsx
// PageTransition.jsx — overlay que cubre y descubre
const enter = () => gsap.to(overlay, {
  scaleY: 1,
  transformOrigin: 'bottom',
  duration: 0.5,
  ease: 'power3.inOut',
})

const exit = () => gsap.to(overlay, {
  scaleY: 0,
  transformOrigin: 'top',
  duration: 0.5,
  ease: 'power3.inOut',
  delay: 0.1,
})
```

### Línea que se dibuja (separadores, bordes)
```jsx
gsap.from(linea, {
  scaleX: 0,
  transformOrigin: 'left',
  duration: 0.8,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: linea,
    start: 'top 90%',
    once: true,
  }
})
```

---

## Reproductor de Música

El reproductor tiene animaciones propias. Reglas:
- Las animaciones del reproductor NO deben interferir con ScrollTrigger del resto
- Si el reproductor usa posición fixed, verificar que no afecte el CLS
- La barra de progreso debe animarse con CSS transitions, no GSAP (más eficiente)
- El icono de "reproduciendo" (equalizer) puede usar CSS keyframes

```css
/* Equalizer animado - CSS puro, más eficiente que GSAP */
@keyframes bar {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

.bar-1 { animation: bar 0.8s ease-in-out infinite; }
.bar-2 { animation: bar 0.8s ease-in-out infinite 0.2s; }
.bar-3 { animation: bar 0.8s ease-in-out infinite 0.4s; }
```

---

## Galería

```jsx
// Entrada escalonada de fotos
gsap.from(fotos, {
  opacity: 0,
  scale: 0.96,
  duration: 0.6,
  ease: 'power2.out',
  stagger: {
    amount: 0.8,
    from: 'start',
  },
  scrollTrigger: {
    trigger: grilla,
    start: 'top 80%',
    once: true,
  }
})
```

---

## Mobile

```jsx
// Siempre usar matchMedia para separar desktop/mobile
const mm = gsap.matchMedia()

mm.add('(max-width: 767px)', () => {
  // Animaciones simplificadas: solo opacity + y pequeño
  gsap.from(elementos, {
    opacity: 0,
    y: 16,
    duration: 0.5,
    stagger: 0.06,
    scrollTrigger: { trigger: contenedor, start: 'top 85%', once: true }
  })
})

mm.add('(min-width: 768px)', () => {
  // Animaciones completas con parallax, scale, etc.
})
```

---

## Checklist de Animaciones

- [ ] Todos los useEffect tienen ctx.revert() en el cleanup
- [ ] Parallax solo en desktop con matchMedia
- [ ] ScrollTriggers con `once: true` donde corresponde
- [ ] Easings del proyecto usados consistentemente
- [ ] Sin bounce en elementos editoriales
- [ ] Reproductor usa CSS transitions para la barra de progreso
- [ ] Transiciones de página implementadas
