# Skill: UX — GACETA Web

## Principio Central

La web de GACETA es una experiencia cultural, no un sitio informativo. Cada interacción debe sentirse como parte del universo del sello: directa, intensa, bien ejecutada.

---

## Reproductor de Música

El reproductor es el elemento más diferenciador del sitio. Reglas:

- Siempre visible en todas las páginas (fixed o sticky)
- El usuario nunca debe perder el track actual al navegar entre páginas
- Estado del reproductor persistente durante la sesión
- Controles mínimos pero suficientes: play/pause, track info, shuffle indicator
- Visualización del estado: qué está sonando, duración, progreso
- No interrumpir la música al hacer scroll o interactuar con la página

**UX del shuffle**: Dejar claro al usuario que el orden es aleatorio. Un indicador visual de "modo shuffle activo" evita confusión.

---

## Navegación

```
Reglas de navegación:
✓ El usuario siempre sabe en qué página está
✓ Transición de página fluida (no flash blanco)
✓ El menú no compite visualmente con el contenido
✓ En mobile: menú fullscreen, fácil de cerrar
✗ No usar submenús ni dropdowns
✗ No ocultar la nav al hacer scroll down (el logo debe ser siempre visible)
```

### Active state en nav
```jsx
// Indicador de página actual — sutil pero claro
<nav>
  <a 
    href="/galeria"
    className={`
      text-sm font-semibold tracking-widest uppercase
      transition-colors duration-200
      ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}
    `}
  >
    Galería
  </a>
</nav>
```

---

## Galería

- Las fotos deben poder verse en grande (lightbox o fullscreen)
- En mobile: swipe horizontal entre fotos en modo fullscreen
- Filtros si aplica, pero sin complejidad innecesaria
- Lazy loading con placeholder de color dominante (no spinner genérico)
- El nombre/crédito del fotógrafo visible pero sin competir

---

## Home — Flujo de Scroll

Cada sección del home debe tener una intención narrativa:

1. **Hero**: Impacto inmediato. El usuario entiende qué es GACETA en 2 segundos
2. **Transición**: Una sección de "respiro" antes de más contenido
3. **Contenido principal**: Artistas, releases, o lo más importante ahora
4. **Galería preview**: Muestra de lo visual, lleva a /galeria
5. **Footer / cierre**: Coherente con el tono del sello

El scroll debe sentirse como recorrer un editorial de revista.

---

## Microinteracciones

Pequeñas pero importantes:
- Cursor personalizado (si el sitio lo usa, mantenerlo consistente)
- Hover en links: no solo cambio de color, considerar underline animado
- Click feedback en botones: escala sutil (scale 0.97 al presionar)
- Loading states: nunca dejar al usuario sin feedback

```jsx
// Feedback de click
<button 
  className="active:scale-[0.97] transition-transform duration-100"
>
  ...
</button>
```

---

## Accesibilidad Mínima

Sin comprometer la estética:
- Contraste mínimo WCAG AA en texto sobre fondos (4.5:1)
- Focus visible en elementos interactivos (outline o border)
- Alt text en todas las imágenes
- El reproductor operable con teclado (space para play/pause)
- Respetar `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance como UX

La velocidad ES parte de la experiencia:
- Primera imagen visible < 1.5s en 4G
- No bloquear el scroll con JS pesado
- Feedback inmediato en interacciones (< 100ms)
- Si algo tarda, mostrar algo (skeleton, fade, lo que sea)

---

## Mobile — Prioridades

El tráfico mobile probablemente supera el 60%. Verificar:

- [ ] El reproductor se puede operar con el pulgar en mobile
- [ ] Los títulos display no se cortan ni overflow
- [ ] Las imágenes no se ven pequeñas en mobile
- [ ] El menú se abre y cierra fácilmente
- [ ] El scroll es suave (Lenis configurado para touch)
- [ ] No hay elementos que requieran hover para funcionar

---

## Checklist UX por Página

### Home
- [ ] Hero comunica la identidad en < 3 segundos
- [ ] El scroll tiene ritmo (denso / respiro / denso)
- [ ] Hay un CTA claro en la primera sección

### Galería
- [ ] Las fotos se pueden ver en grande
- [ ] Lazy loading funcionando
- [ ] Mobile: grid que se adapta bien a portrait y landscape

### Nosotros
- [ ] El tono del texto es coherente con la identidad del sello
- [ ] No es una lista de logros, es una narrativa
- [ ] Hay elementos visuales que acompañan el texto
