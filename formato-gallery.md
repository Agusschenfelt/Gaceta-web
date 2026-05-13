# Formato de items — Galería GACETA

Archivo de referencia para agregar contenido a `src/data/gacetaGalleryItems.js`.

---

## Imagen (optimizada con srcset)

Usar cuando la imagen tiene versiones responsivas generadas (320/560/840/1120/1440 + dl).

```js
{
  id: 'nombre-unico',          // string único, sin espacios
  type: 'image',
  base: 'nombre-base',         // nombre base del archivo sin extensión ni sufijo de ancho
                               // Se construyen automáticamente: /media/img/{base}-{ancho}.avif/.webp y {base}-dl.jpg
  src: '/media/img/nombre-base-dl.jpg', // fallback directo (jpg de máxima resolución)
  alt: 'Descripción accesible de la imagen',
}
```

**Archivos necesarios en `/public/media/img/`:**
```
nombre-base-320.avif   nombre-base-320.webp
nombre-base-560.avif   nombre-base-560.webp
nombre-base-840.avif   nombre-base-840.webp
nombre-base-1120.avif  nombre-base-1120.webp
nombre-base-1440.avif  nombre-base-1440.webp
nombre-base-dl.jpg     ← original / máxima resolución
```

---

## Imagen (src directo, sin srcset)

Usar cuando la imagen no tiene versiones responsivas. Carga directa sin optimización.

```js
{
  id: 'nombre-unico',
  type: 'image',
  src: '/assets/ruta/imagen.webp', // ruta directa desde /public
  alt: 'Descripción accesible de la imagen',
}
```

> Omitir el campo `base` para que SmartImage use el `src` directo como fallback.

---

## Video

Los videos solo se reproducen mientras estén visibles en el viewport (IntersectionObserver, threshold 0.25). Siempre silenciados, en loop, sin controles.

```js
{
  id: 'nombre-unico',
  type: 'video',
  srcMp4: '/assets/videos/nombre.mp4',    // formato principal (requerido si no hay webm)
  srcWebm: '/assets/videos/nombre.webm',  // formato preferido (opcional, carga primero si existe)
  poster: '/assets/videos/nombre-poster.jpg', // frame de preview mientras carga (recomendado)
  alt: 'Descripción del video para accesibilidad',
}
```

**Notas:**
- Si no hay `srcWebm`, solo se usa `srcMp4`.
- `poster` evita flash de pantalla negra antes de cargar; se recomienda siempre.
- Sin `srcMp4` ni `srcWebm` el elemento de video renderiza vacío — siempre incluir al menos uno.
- Videos comprimidos a H.264 (mp4) o VP9/AV1 (webm) para mejor compatibilidad.

---

## Campos opcionales compartidos

Ninguno es obligatorio salvo `id`, `type` y al menos una fuente de media.

| Campo   | Tipo     | Descripción                                          |
|---------|----------|------------------------------------------------------|
| `id`    | string   | Identificador único. Se usa como `key` en React.     |
| `type`  | string   | `'image'` o `'video'`                                |
| `alt`   | string   | Texto alternativo accesible. Dejar `''` si decorativa.|
| `title` | string   | Título opcional mostrado en el lightbox.             |

---

## Ejemplo de array mixto

```js
export const GACETA_GALLERY_ITEMS = [
  // Imagen optimizada
  {
    id: 'show-cordoba-01',
    type: 'image',
    base: 'foto-final-cordoba',
    src: '/media/img/foto-final-cordoba-dl.jpg',
    alt: 'Show en Córdoba',
  },

  // Imagen directa (sin srcset)
  {
    id: 'backstage-ramma',
    type: 'image',
    src: '/assets/artistas/ramma/fotos/perfil1.webp',
    alt: 'Ramma backstage',
  },

  // Video
  {
    id: 'aftermovie-inmortal',
    type: 'video',
    srcMp4: '/assets/videos/aftermovie-inmortal.mp4',
    srcWebm: '/assets/videos/aftermovie-inmortal.webm',
    poster: '/assets/videos/aftermovie-inmortal-poster.jpg',
    alt: 'Aftermovie tour Inmortal',
  },
];
```
