# CLAUDE.md — Heardle GACETA

Guía para trabajar en este subproyecto. Leela entera antes de tocar código: está pensada para que puedas hacer fixes chicos sin explorar el repo.

## Qué es

Juego tipo Heardle/Songly con el catálogo del sello GACETA. Una sola pantalla: escuchás un fragmento corto, adivinás el tema con un buscador, cada fallo o skip alarga el fragmento. Al terminar se revela el tema, se comparte el resultado y hay un ranking simple que sirve para captar mails. Brief original en `brief-heardle-gaceta.md`.

Vive dentro del repo de la web de GACETA (`Gaceta-web/heardle-gaceta/`) pero es un proyecto Vite independiente con su propio `package.json`. No comparte código con la web, solo la identidad visual.

## Comandos

```bash
npm install --legacy-peer-deps   # siempre con --legacy-peer-deps
npm run dev                      # Vite en http://localhost:5173
npm run test                     # vitest (solo motor y share, entorno node)
npm run build                    # build a dist/
npm run catalog                  # arma el catálogo (ver sección Catálogo)
npm run catalog -- --only ramma,valuto   # solo esos artistas
npm run catalog -- --dry                 # sin escribir nada
npm run compress-audio                   # recorta los mp3 nuevos a 16 s mono 96k
npm run compress-audio -- --dry          # sin escribir nada
npm run peaks                            # envolventes de onda para el visualizador
```

> **Después de cada `npm run catalog` hay que correr `npm run compress-audio` y después
> `npm run peaks`**, en ese orden: el catálogo baja previews de 30 s stereo, el juego solo usa
> 16 s mono, y las envolventes se calculan sobre el audio ya recortado. Ver sección Audio.

Variables en `.env` (no está en git, ver `.env.example`):

| Variable | Quién la usa |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Solo `npm run catalog`. Nunca llegan al browser. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Ranking y mails. Vacías = adapter local con localStorage. |

## Stack y reglas duras

- React 19 + Vite 6 + Tailwind 3 + Vitest. Supabase JS solo se carga por `import()` dinámico si hay env.
- **No agregar dependencias.** Nada de GSAP, router, framer-motion ni librerías de UI. El juego tiene que ser liviano.
- **Código, identificadores y comentarios en inglés.** Copy de UI en español neutro con voseo suave ("Adiviná el tema", "Escuchá", "Compartí"). Sin lunfardo.
- **Colores y fuentes solo por tokens.** Nunca un hex en un componente. Todo sale de `src/theme/tokens.css` y de las clases Tailwind mapeadas en `tailwind.config.js` (`bg`, `fg`, `muted`, `accent`, `danger`, `surface`, `border`, `font-sans`, `font-display`).
- **El motor (`src/game/engine.js`) es puro.** Sin React, sin DOM, sin localStorage. Cualquier regla nueva del juego va ahí y se testea en `engine.test.js`.
- **Mobile-first**, una sola columna, sin scroll horizontal. Respetar `prefers-reduced-motion`.
- **Identidad visual** (heredada de la web de GACETA): fondo `#0a0a0a` con noise, texto blanco, acento acid gold `#dee5a0` usado con moderación (ring del play, estados correctos, foco), rojo `#911e1e` para errores. Inter bold con tracking apretado para títulos, Instrument Serif italic para una palabra de contraste. Nada de gradientes, glow ni glassmorphism.

## Dónde tocar según lo que quieras cambiar

| Querés cambiar… | Archivo |
|---|---|
| Duraciones de los stages y cómo se calcula el score | `src/game/engine.js` (`STAGES`, `MAX_SCORE` arriba de todo) + `engine.test.js`. Si una etapa pasa de 16 s, leer la sección Audio |
| Qué layout se usa según el ancho | `src/containers/GameContainer.jsx` (`isWide`) + `src/hooks/useMediaQuery.js` |
| Largo del recorte de los mp3, bitrate, dónde quedan los originales | `scripts/compress-audio.mjs` (`CLIP_SECONDS`, `BITRATE`) |
| Cuánto silencio inicial se recorta y con qué umbral | `scripts/compress-audio.mjs` (`ONSET_THRESHOLD`, `LEAD_IN`, `MAX_TRIM`) + `scripts/lib/onset.mjs` (`SILENCE_FLOOR`) |
| Texto y emojis del share | `src/game/share.js` |
| Cómo se elige el tema al azar, cuántos recientes se evitan | `src/catalog/pickTrack.js` (`RECENT_LIMIT`, clave `heardle:recent`) |
| Ranking del buscador, cuántos resultados, normalización de acentos | `src/catalog/search.js` |
| Cómo se cargan y mezclan los JSON del catálogo | `src/catalog/loadCatalog.js` |
| Reproducción: cuándo arranca, cuándo corta, anillo de progreso | `src/audio/useAudioPlayer.js` |
| Flujo general, qué se muestra cuando, orden de paneles, localStorage de filtros | `src/containers/GameContainer.jsx` |
| Pantalla de juego (círculo, contador, buscador, skip, historial) | `src/components/organisms/GameBoard.jsx` y las moléculas que usa |
| Círculo de play, anillo y barras de onda | `src/components/molecules/PlayCircle.jsx` |
| Cómo se calculan las barras (cantidad, altura mínima) | `src/audio/waveform.js` (`BAR_COUNT`, `MIN_HEIGHT`) + `waveform.test.js` |
| Envolventes de onda por tema | `scripts/build-peaks.mjs` → `public/catalog/peaks.json` |
| Autocomplete (teclado, ARIA, dropdown) | `src/components/molecules/GuessSearch.jsx` |
| Barra de segmentos arriba | `src/components/molecules/StageProgress.jsx` + `atoms/Segment.jsx` |
| Historial de intentos (cruz roja, "Salteado") | `src/components/molecules/GuessHistory.jsx` |
| Chips de artistas, línea de ajustes colapsable | `src/components/molecules/GameSettings.jsx` |
| Reveal final (carátula, título, Spotify, share, jugar otra vez) | `src/components/organisms/ResultReveal.jsx` |
| Ranking, formulario de alias, cuántas filas entran (`TOP_ROWS`) | `src/components/organisms/Leaderboard.jsx` |
| Captura de mail | `src/components/organisms/EmailCapture.jsx` |
| Validación de alias, id anónimo | `src/player/playerIdentity.js` (`ALIAS_MIN`, `ALIAS_MAX`) |
| Persistencia del ranking (Supabase o local) | `src/leaderboard/supabaseAdapter.js`, `localAdapter.js`; la interfaz común está en `leaderboardApi.js` |
| Esquema de base de datos | `supabase/schema.sql` |
| Colores, fuentes, radio, noise | `src/theme/tokens.css` |
| Estilos base, focus ring, reduced motion, clase `.label` | `src/index.css` |
| Título, meta tags, fuentes de Google | `index.html` |
| Marco de una pantalla, header, wordmark, safe areas | `src/App.jsx` |
| Isotipo dentro del círculo (tamaño, máscara) | `src/components/molecules/PlayCircle.jsx` (`ISOTYPE_MASK`) |
| Favicon, tarjeta de compartir, meta tags | `index.html` + `public/og.png`, `public/favicon.png` |
| Íconos (check, cruz, cerrar, chevron, trofeo) | `src/components/atoms/Icon.jsx` |
| Qué vista se muestra (juego / resultado / ranking) | `src/containers/GameContainer.jsx` (estado `showRanking`) |
| Lista de artistas y sus IDs de Spotify | `data/artists.json` |
| Cómo se arma el catálogo | `scripts/build-catalog.mjs` |
| Reintentos al guardar la partida (cuántos, backoff) | `src/leaderboard/retry.js` |
| Stub de localStorage para los tests | `src/test-utils/localStorage.js` |

## Flujo de datos (leer una vez)

1. `GameContainer` monta, llama a `loadCatalog()` que trae `public/catalog/index.json` y después un JSON por artista, mezcla todo y deduplica por ISRC (`track.id`). Un feature entre artistas queda una sola vez con `artistSlugs: [...]`.
2. `pickTrack(tracks, artistFilter)` elige un tema al azar del pool filtrado evitando los últimos jugados (localStorage `heardle:recent`).
3. `createGame({ track })` arma el estado. `game.stages` es el array de segundos; `game.stageIndex` el intento actual; `game.attempts` el historial (`{type:"guess", trackId, correct}` o `{type:"skip"}`); `game.status` es `playing | won | lost`.
4. Play: `useAudioPlayer(track.audioFile)` crea un `new Audio()`, y `play(seconds)` reproduce desde 0 hasta `currentClipSeconds(game)`. El corte lo hacen un `setTimeout` armado en `onplaying` y el evento `timeupdate`; el `requestAnimationFrame` solo dibuja el anillo (ver Gotchas).
5. Guess desde el autocomplete → `engine.guess(state, trackId)`; skip → `engine.skip(state)`. Ambos devuelven un estado nuevo (inmutable).
6. Cuando `isOver(game)`, un efecto en `GameContainer` llama a `api.submitGame(...)` y refresca el ranking. `ResultReveal` **reemplaza** al `GameBoard` (no se apila debajo). Desde ahí se llega al `Leaderboard`, que es otra vista y se come el formulario de alias y `EmailCapture`.

Score: si ganás, `stages.length - índice del stage ganador` (acertar de una = 4 puntos, en el
último intento = 1). Perder = 0. El ranking suma puntos por jugador y solo muestra jugadores con alias.

**No hay niveles de dificultad, y es a propósito.** Había tres (`DIFFICULTIES`) y se sacaron el
2026-09-18. Una sola escalera `STAGES = [0.5, 1, 3, 8]` para todos, porque:

- Con niveles, tu "3/4" y el mío significan cosas distintas, y el texto que se comparte ni siquiera
  decía el nivel. El resultado comparable es lo único que este género no puede perder: es lo que
  hace que se comparta.
- El ranking sumaba puntos de tres juegos distintos en una tabla sola.
- `score = stages.length - stageIndex` hacía que el nivel con más etapas diera más puntos, o sea
  que Fácil pagaba más que Difícil. El problema desaparece solo con una escalera única.
- Con 431 temas y la audiencia de un sello, partirla en tres es peor.

Si alguien quiere reponerlos, que lea esto primero y resuelva lo del resultado compartido.

## Contratos de datos

**Track en `public/catalog/<slug>.json`** (lo genera el script, no editar a mano salvo para corregir un dato puntual):

```json
{
  "id": "UYT142400046",          // ISRC, también es el nombre del mp3
  "title": "INMORTAL",
  "artist": "Ramma",              // artista dueño de este archivo
  "artists": ["Ramma", "Dazen"],  // todos los acreditados
  "audio_file": "/audio/UYT142400046.mp3",
  "cover_url": "https://i.scdn.co/image/...",
  "spotify_url": "https://open.spotify.com/track/...",
  "release": "INMORTAL",
  "release_date": "2025-01-01",
  "duration_ms": 97000,
  "deezer_id": 3065838071
}
```

`public/catalog/index.json`: `[{ "slug", "name", "tracks" }]`. La app lee el índice de forma dinámica: agregar un artista es correr el script, no tocar código.

**Track en memoria** (lo que ven los componentes, sale de `loadCatalog`): `{ id, title, artists, artistSlugs, audioFile, coverUrl, spotifyUrl, release, releaseDate }`. Ojo con el camelCase: el JSON usa snake_case, la app camelCase, la conversión está en `loadCatalog.js`.

**Interfaz del leaderboard** (`leaderboardApi.js`): `submitGame({ playerId, trackId, won, stageWon, attempts, score })`, `getTop(limit)` → `[{ alias, gamesPlayed, totalScore, avgScore }]`, `setAlias(playerId, alias)`, `subscribeEmail(email, playerId)`. Los dos adapters implementan exactamente eso.

**localStorage** (todas las claves con prefijo `heardle:`): `playerId`, `alias`, `artistFilter`, `recent`, `emailPrompt` (`pending | done | dismissed`), y `local:games`, `local:aliases`, `local:emails` cuando no hay Supabase. Quien jugó antes del 2026-09-18 puede tener todavía un `heardle:difficulty` huérfano; no se lee más y no molesta.

## Catálogo

`scripts/build-catalog.mjs`, por artista de `data/artists.json`:

1. Spotify: lista álbumes, singles y apariciones del artista y se queda con los tracks donde está acreditado. Después pide cada track de a uno para sacar el ISRC y el link.
2. Deezer: resuelve el track por ISRC (`/2.0/track/isrc:XXX`), fallback por título + artista. Deezer no necesita token.
3. Descarga la preview de 30 s a `public/audio/<ISRC>.mp3`. **Hay que descargarla**: las URLs de preview de Deezer están firmadas y expiran.
4. Escribe `public/catalog/<slug>.json`, `index.json` y `data/missing.json` (temas sin preview, para completar a mano bajando de YouTube).

Es idempotente: no vuelve a bajar mp3 que ya existen y cachea los tracks de Spotify en `data/cache/`. Si se corta, `index.json` se reconstruye igual con lo que haya.

**Límites de Spotify en modo desarrollo** (la app "heardle gaceta" del dashboard):
- `/artists/{id}/albums` rechaza `limit` mayor a 10.
- Los endpoints batch (`/tracks?ids=`, `/albums?ids=`) devuelven 403. Por eso va de a uno.
- Hay cuota diaria. Cuando se agota devuelve 429 con `retry-after` de ~24 h. El script detecta eso, corta limpio y se reanuda con `--only <los que faltan>`.

**Estado al 2026-09-18: los 8 artistas están completos.**

| Artista | Tracks en su JSON |
|---|---|
| Ramma | 116 |
| Valuto | 41 |
| ARA | 62 |
| Tadu Vázquez | 104 |
| Fosse | 30 |
| Barta | 22 |
| Dazen | 9 |
| Lonzo | 114 |

Eso suma 498, pero el juego tiene **431 temas**: la diferencia son colaboraciones que aparecen en
el JSON de los dos artistas y `loadCatalog` las deduplica por ISRC, dejando una sola con
`artistSlugs: [...]`. Los dos números son correctos, miden cosas distintas — el índice cuenta por
artista, el pool cuenta grabaciones.

**Sin preview en Deezer: 12, todas de Tadu Vázquez** (ver `data/missing.json`): Bloque, Quererse,
Diluvio, Me Conocen, Contigo, Sangre, Watch Out, MVP, Ambición, Sombras, Whisky a las Rocas,
Tan Bien. Para sumarlas hay que conseguir el audio a mano y dejarlo en `public/audio/<ISRC>.mp3`.

El script deja los mp3 en 30 s stereo tal como vienen de Deezer. Correr `npm run compress-audio` y
después `npm run peaks` (ver sección Audio).

## Marca

Los assets salen del repo de la web: `Gaceta-web/public/assets/logos/`. Acá viven ya recortados
y optimizados, 84 KB en total:

| Archivo | Qué es | Dónde se usa |
|---|---|---|
| `public/assets/gaceta-word.webp` | Solo la palabra GACETA®, recortada al ras | Header |
| `public/assets/gaceta-iso.png` | Solo el isotipo, blanco sobre transparente | Máscara CSS del círculo de play |
| `public/favicon.png` + `apple-touch-icon.png` | Isotipo sobre `#0a0a0a` | `index.html` |
| `public/og.png` | Tarjeta de compartir 1200×630 | `og:image` / `twitter:image` |

Tres decisiones que conviene no deshacer sin querer:

- **El lockup está repartido, no repetido.** El header lleva la palabra; el isotipo es el botón de
  play. Juntos forman el logo completo. Si volvés a meter el lockup entero en el header, el
  isotipo aparece dos veces en la misma pantalla.
- **El isotipo se pinta como `mask-image`, no como `<img>`.** Así toma `currentColor` desde
  `bg-fg` y sigue los estados de disabled y loading. Un `<img>` no puede hacer eso. Está en
  `ISOTYPE_MASK` arriba de `PlayCircle.jsx`.
- **`gaceta-word.webp` está recortado para que su borde inferior sea la línea de base de las
  letras.** Por eso `items-baseline` lo alinea con la itálica de "heardle". Si lo re-exportás con
  otro recorte, la alineación se rompe.

La tarjeta de compartir se generó con ImageMagick usando las fuentes reales del proyecto (Inter
SemiBold + Instrument Serif italic, bajadas al vuelo y descartadas). Dos cosas que me costaron:
`-draw text x,y` toma la línea de base **solo si no hay `-gravity` activo**; con gravity toma el
tope de la caja. Y el lockup incluye el isotipo, que es más alto que la palabra, así que el borde
inferior de esa imagen no es la línea de base del texto.

**Pendiente al deployar:** `og:image` está en ruta relativa porque el dominio no está decidido.
Varios scrapers no resuelven relativas — hay que pasarlo a absoluto.

## El visualizador (por qué NO usa Web Audio)

Las barras dentro del círculo son la forma de onda real del tema. Antes eran tres barras con un
`@keyframes` que fingía seguir la música; ahora leen la envolvente precalculada del tema.

**La decisión importante: no se usa `AnalyserNode`.** `createMediaElementSource` captura la salida
del elemento de audio de forma **permanente** — si el `AudioContext` queda suspendido, el juego se
queda mudo y no hay vuelta atrás. Verificado en esta máquina: `ctx.resume()` directamente cuelga en
una pestaña oculta. Arriesgar el audio, que es el producto entero, por un efecto visual es un mal
negocio.

En su lugar:

1. `scripts/build-peaks.mjs` decodifica cada mp3 a PCM mono 8 kHz con ffmpeg y lo reduce a **64
   valores RMS** (0–255), normalizados contra el pico del propio tema para que los temas bajos
   también llenen el anillo. Sale `public/catalog/peaks.json`: con 431 temas son 107 KB crudos / **39 KB gzip**.
2. **`loadPeaks()` es una función aparte y NO se espera junto al catálogo.** Con 431 temas,
   `peaks.json` pesa 39 KB gzip: la mitad de todo lo que se baja al arrancar, para decoración. Que
   eso se interponga entre el jugador y la primera ronda estaría mal. `GameContainer` dispara las
   dos cargas en paralelo y las barras llegan cuando llegan. Si falla, resuelve a `{}` y las barras
   quedan planas; nunca rechaza.
3. `src/audio/waveform.js` es **pura y testeada**: `barHeights(peaks, time, duration)` devuelve las
   alturas leyendo una ventana de la envolvente centrada en el momento actual, así las barras se
   mueven desfasadas entre sí en vez de todas juntas.
4. El tick de `requestAnimationFrame` de `useAudioPlayer` las actualiza. **Es solo visual**: el
   corte del fragmento sigue dependiendo de `setTimeout` + `timeupdate`, como siempre.

Dos detalles que no conviene deshacer:

- Las barras se animan con **`scaleY`, no con `height`**. Cinco barras cambiando de alto a 60fps
  fuerzan layout en cada frame; el detector de impeccable lo marca y tiene razón.
- Con `prefers-reduced-motion` las barras quedan fijas (`REDUCED_MOTION` arriba de `PlayCircle`).

## Layout: una sola pantalla (regla dura)

**Nada scrollea, nunca, en ninguna vista.** Es un pedido explícito del usuario, no una preferencia.

- `App.jsx` es un marco de alto fijo: `h-svh` + `overflow-hidden`, con `env(safe-area-inset-*)`
  para el notch. Ese `overflow-hidden` es el contrato: si algo no entra, se recorta en silencio,
  así que **cualquier fila que agregues le saca alto al círculo**.
- Hay **tres vistas mutuamente excluyentes**, cada una dueña del marco completo:
  juego, resultado y ranking. Nunca se apilan. Las rutea `GameContainer` con `showRanking` + `isOver`.
- **Dos layouts según el ancho**, decididos con `useMediaQuery("(min-width: 1024px)")` en
  `GameContainer`, no con CSS:
  - Angosto: ajustes como línea colapsable arriba, historial debajo del buscador.
  - Ancho: tres columnas `13rem / 26rem / 13rem`. Ajustes a la izquierda siempre abiertos
    (`variant="panel"` en `GameSettings`), juego al medio, intentos a la derecha. El marco pasa a
    `lg:max-w-5xl`; resultado y ranking se quedan en `max-w-md` centrado para no estirarse.

  Se decide en JS y no con `lg:hidden` **a propósito**: dos copias del historial en el DOM serían
  dos elementos con el mismo `aria-label`, y eso es peor que un re-render.
- El elemento elástico de cada vista es el que absorbe el sobrante: el círculo de play en el juego,
  la carátula en el resultado. Van con `aspect-square h-full max-h-96 w-auto max-w-full` dentro de un
  contenedor `flex-1 basis-0 min-h-0`. Todo lo demás es `shrink-0`.
- El ranking está capado en `TOP_ROWS = 10` en vez de scrollear. Si el jugador queda afuera del top,
  su fila se muestra aparte abajo.
- La única excepción es el dropdown del autocomplete, que scrollea internamente (es un combobox) y
  abre **hacia arriba**, porque el input queda contra el borde inferior.

Si agregás algo a una vista, verificá que siga entrando con esto en la consola del browser:

```js
const f = document.querySelector("#root > div");
f.style.cssText = "height:640px;width:360px;max-width:360px";   // la pantalla más chica que soportamos
[...f.querySelectorAll("section,ol,div,main,header,form,p,h2")]
  .filter(el => el.scrollHeight - el.clientHeight > 1 && el.clientHeight > 0);   // tiene que dar []
f.style.cssText = "";
```

**Ojo al medir en una pestaña oculta:** Chrome pausa las animaciones CSS, así que cada fila con
`.fade-up` queda congelada en su `translateY(6px)` inicial y reporta 6px de desborde fantasma.
Neutralizala antes de medir: `.fade-up { animation: none !important }`.

**Ojo con `.headline`:** define `line-height: .9` en `index.css` *después* de `@tailwind utilities`,
así que le gana por especificidad a `leading-*`. Para pisarlo hace falta el modificador important
(`!leading-snug`). Con el line-height por defecto, la itálica de Instrument Serif se corta abajo.

## Audio

`scripts/compress-audio.mjs` (`npm run compress-audio`). Las previews de Deezer son 30 s stereo
128 kbps, pero la etapa más larga del juego son **15 s** (`easy` en `engine.js`), así que se
recortan a 16 s mono 96 kbps. Medido sobre los 431 temas: **~197 MB → 81 MB (-60%)**, de 480 KB a
188 KB por tema. Eso es lo que se ahorra el que juega desde el celular en cada reproducción.

- **Los originales se guardan en `audio-raw/`**, que está en `.gitignore`. Son la fuente para
  volver a comprimir con otros parámetros sin gastar cuota de Spotify ni volver a bajar de Deezer.
- **Es idempotente.** Detecta lo ya comprimido (mono y ≤ 16,5 s) y lo saltea. Correrlo de nuevo
  después de `npm run catalog` solo toca los temas nuevos.
- Flags: `--dry`, `--force`, `--seconds=20`, `--bitrate=128k`.
- **`public/audio/` ahora sí va a git.** Con 38 MB entra cómodo; el límite de static file uploads
  de Vercel es 100 MB en Hobby y 1 GB en Pro, y el equipo es Pro.

**Si algún día agregás una etapa de más de 16 s** en `STAGES`, los mp3 actuales se cortan
antes de tiempo. Hay que correr `npm run compress-audio -- --force --seconds=<nuevo>`, que
re-comprime desde `audio-raw/`. Si borraste `audio-raw/`, hay que volver a bajar las previews.

### Recorte del silencio inicial

El mismo script corta el silencio de arranque. La primera etapa dura 0,5 s, así que un tema que
tarda un segundo en sonar te quema el primer intento en nada, y el jugador no tiene cómo saber que
no fue culpa suya. Medido sobre los 431: **14 temas tenían la primera etapa entera muda**, el peor
2,45 s. Después del recorte: **cero**.

Se arregla en el build y no en el reproductor a propósito. La alternativa era un `startOffset` por
tema en el catálogo: eso mete estado nuevo en el contrato del catálogo, en el mapeo de tiempo de las
barras de onda y en la matemática del fragmento que vive en el motor puro. Tres capas para un
defecto que es del archivo.

**El umbral de silencio es absoluto (-60 dBFS, `SILENCE_FLOOR = 33`) y tiene que seguir siéndolo.**
La primera versión usaba "10% del pico del segmento", copiado de `build-peaks.mjs` — donde
normalizar contra el pico del tema está bien, porque ahí el objetivo es dibujar barras comparables.
Para autorizar un corte destructivo está mal, y no por gusto: **un umbral relativo no es estable
bajo la operación que autoriza**. Al recortar se corre la ventana, cambia el pico, cambia el umbral,
y la cabeza ya recortada vuelve a leerse como silencio. Con `UYB282548653` (fade-in largo y muy
bajo) el pico pasó de 699 a 1165 y el archivo pedía recorte en cada corrida, apilando pérdida de
generación de mp3. El test `onset.test.mjs` fija la regresión: cortar en el onset no puede dejar un
onset nuevo.

Un piso absoluto también es más conservador, que es lo que querés en un corte destructivo: nunca
toca nada audible. Recorta 13 archivos, de 0,13 s a 1,64 s.

**Después de recortar hay que correr `npm run peaks -- --force`.** `build-peaks.mjs` saltea los IDs
que ya están en `peaks.json`, así que sin `--force` los temas recortados se quedan con la envolvente
vieja y las barras no coinciden con lo que suena.

Dato útil: `--force` en `compress-audio` re-encodea los 431 pero **el diff de git sigue siendo solo
los que cambiaron**. El encode es determinístico, así que los intactos salen byte-idénticos.

**Lo que esto NO arregla:** 5 temas abren por debajo de -40 dBFS (el peor, `UYB282548653`, a -55,7
contra un cuerpo de -36,0). No tienen silencio, tienen un fade-in largo. Recortar más sería cortar
contenido audible. El arreglo honesto es ganancia por tema — normalización de loudness, que es otra
decisión y está sin hacer.

**`peaks.json` no sirve para medir esto.** Sus buckets son de 250 ms (16 s / 64 valores) y la
primera etapa dura 500 ms, así que subestima: encontraba 21 temas donde midiendo PCM a 25 ms hay 26.

## Supabase

Correr `supabase/schema.sql` en el SQL editor del proyecto y cargar las dos `VITE_SUPABASE_*`. Tablas `players`, `games`, `emails`; vista `leaderboard`. Acceso anónimo con RLS; el modelo de confianza está comentado arriba del archivo (el cliente manda su propio `playerId`, no hay auth). El adapter de Supabase **no se probó contra un proyecto real todavía**; el local sí.

## Cómo verificar un cambio

1. `npm run test` — tiene que dar **93/93** en 9 archivos (o más si agregás tests). El `include` de vitest cubre `src/**/*.test.js` y `scripts/**/*.test.mjs`, así que el tooling de build se testea donde vive.
2. `npm run build` — tiene que compilar.
3. Probar a mano en `npm run dev`: cargar, play, un guess incorrecto, un skip, llegar al reveal, share, alias, mail. El ranking en modo local se ve en localStorage.

Los tests corren en entorno `node`, sin jsdom. Lo que es lógica pura o va contra storage se
testea igual usando el stub de `src/test-utils/localStorage.js`. Para testear **componentes o
hooks** sí haría falta jsdom, y eso implica una dependencia nueva: sigue sin estar.

### Tres cosas que Chrome hace distinto en pestañas ocultas

Las tres me mandaron por pistas falsas midiendo con automatización. Si un número no cierra,
sospechá de esto antes que del código:

1. **No carga ni decodifica audio.** Si el play "no hace nada", fijate que la pestaña esté visible.
2. **Pausa las animaciones CSS** en su primer frame. Cada fila con `.fade-up` queda congelada en su
   `translateY(6px)` y reporta 6px de desborde fantasma. Neutralizar con
   `.fade-up { animation: none !important }` antes de medir layout.
3. **Estrangula los `setTimeout`.** Un backoff de 400ms/800ms tardó 10.3s y 20.7s reales. Si estás
   esperando un reintento, esperá mucho más de lo que dice el código, o probá en pestaña visible.

Además, el CDP de Claude in Chrome corta a los 45s: un script que recorre todo el DOM en varios
viewports lo excede y aparece como "renderer frozen". Partirlo en llamadas cortas, con los helpers
instalados en `window`.

Sobre audio específicamente: **Chrome no carga ni decodifica audio en pestañas ocultas** (`document.visibilityState === "hidden"`), ni siquiera blobs en memoria. Si el play "no hace nada", primero fijate que la pestaña esté visible. Para verificar la reproducción sin ver la UI, parchear `HTMLMediaElement.prototype.play/pause` y loguear `currentTime` en el pause. Para verificar que un mp3 es válido y suena (no silencio) **sin depender de la visibilidad**, usar Web Audio, que decodifica igual en pestaña oculta: `fetch(src).then(r=>r.arrayBuffer())` → `ctx.decodeAudioData(buf)` y mirar `duration`, `numberOfChannels` y el pico de `getChannelData(0)`.

## Gotchas conocidos

- **Vite devuelve `index.html` con 200 para cualquier ruta inexistente**, incluso `/catalog/algo.json`. Un `fetch` de un JSON que falta no da 404: falla al parsear. Si "no carga el catálogo", verificá que el archivo exista en `public/`.
- **El corte del fragmento no puede depender de `requestAnimationFrame`.** Se suspende en pestañas ocultas y el tema sigue sonando entero (spoiler). Ya está resuelto con timeout + `timeupdate`; no volver al esquema anterior.
- **React StrictMode en dev** duplica efectos. El efecto que envía el score no tiene clave de idempotencia; en dev puede registrar la partida dos veces en el adapter local. En producción no pasa.
- `GuessSearch` lleva `key={game.track.id}` para vaciar el texto al cambiar de ronda. Si lo sacás, el texto queda pegado entre rondas.
- Los mp3 se llaman por ISRC a propósito: no revelan el título en la pestaña Network. No renombrarlos.
- La carátula solo se muestra en el reveal. No mostrarla antes.

## Backlog (avisos del review, no bloqueantes)

Los cuatro ítems de código se cerraron el 2026-09-18 (ver `odd/tasks/backlog-cleanup.md`):

- ~~`loadCatalog` usa `Promise.all`~~ → ahora `Promise.allSettled`. Un JSON de artista caído ya no
  tumba el catálogo: se juega con lo que cargó y ese artista **desaparece de los chips**, para no
  ofrecer una selección sin temas. Solo falla si no carga ninguno.
- ~~`useAudioPlayer` sin guard de play~~ → token de generación en `playIdRef`. `stop()` lo incrementa
  e invalida cualquier play en vuelo; el loop de `requestAnimationFrame` huérfano se retira solo.
  Además `ready` ahora llega a `PlayCircle` como `loading`: anillo pulsando, glifo atenuado y
  `aria-busy`, sin costar una fila de alto.
- ~~Errores de `submitGame` silenciados~~ → `withRetry` (`src/leaderboard/retry.js`), 3 intentos con
  backoff exponencial, y si igual falla lo dice en el reveal con un botón de reintento.
- ~~Faltan tests~~ → 62 tests en 7 archivos. Nuevos: `loadCatalog`, `search`, `pickTrack`,
  `playerIdentity`, `localAdapter`, `retry`.

Los assets de marca también se cerraron (2026-09-18): salieron de `Gaceta-web/public/assets/logos/`,
ver la sección **Marca**.

**Lo que sigue abierto, porque depende de vos:** dominio/subdominio y deploy — con eso hay que
pasar `og:image` a URL absoluta —, configurar Supabase, y completar los temas sin preview.

Encontrado y arreglado de paso: entre que cargaba el catálogo y arrancaba la ronda se veía un
instante **"No hay temas para esa selección"** aunque había 209. Ese mensaje ahora solo aparece
cuando `poolSize === 0` de verdad; si no, va un spinner.

## Review nativo (Gentle AI, receipt-driven development)

Está activado globalmente. Después de un cambio, el flujo es: `gentle-ai review status --cwd <raíz del repo Gaceta-web> --contract gentle-ai.review-integration/v2 --agent claude-code --next-transition` y seguir el `next_transition` que devuelve. Cosas que ya pasaron y conviene saber:

- La raíz del repo git es `Gaceta-web/`, no `heardle-gaceta/`. Todo el subproyecto está sin trackear, así que el review pide una **selección de archivos untracked**: pasar `--untracked-scope select --expected-untracked-inventory <digest del status> --intended-untracked=<ruta> …`. Excluir `public/audio/` (va a git, pero no tiene sentido mandar 209 mp3 a un reviewer), `audio-raw/`, `.env`, `data/cache/`, `data/missing.json`, `package-lock.json` y el brief.
- Si un fix agrega un archivo nuevo que no estaba en la selección congelada, el review responde `corrected_candidate_unavailable`. Se resuelve con `gentle-ai review recover --disposition scope_changed` (pide autorización del usuario) y una lineage sucesora.
- El primer `status` con selección a veces da `operation_timeout` transitorio. Reportado en gentle-ai#1833. Un reintento idéntico suele andar.
