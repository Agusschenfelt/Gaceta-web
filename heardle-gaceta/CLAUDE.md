# CLAUDE.md — Heardle GACETA

Guía para trabajar en este subproyecto. Leela entera antes de tocar código: está pensada para que puedas hacer fixes chicos sin explorar el repo.

## Qué es

Juego tipo Heardle/Songly con el catálogo del sello GACETA. Una sola pantalla: escuchás un fragmento corto, adivinás el tema con un buscador, cada fallo o skip alarga el fragmento. Al terminar se revela el tema, se comparte el resultado y hay un ranking simple que sirve para captar mails. Brief original en `brief-heardle-gaceta.md`.

Vive dentro del repo de la web de GACETA (`Gaceta-web/heardle-gaceta/`) pero es un proyecto Vite independiente con su propio `package.json`. No comparte código con la web, solo la identidad visual.

## Comandos

```bash
npm install --legacy-peer-deps   # siempre con --legacy-peer-deps
npm run dev                      # Vite en http://localhost:5173
npm run test                     # vitest, entorno node: src/**/*.test.js y scripts/**/*.test.mjs
npm run build                    # build a dist/
npm run catalog                  # arma el catálogo (ver sección Catálogo)
npm run catalog -- --only ramma,valuto   # solo esos artistas
npm run catalog -- --dry                 # sin escribir nada
npm run compress-audio                   # recorta los mp3 nuevos a 16 s mono 96k
npm run compress-audio -- --dry          # sin escribir nada
npm run peaks                            # envolventes de onda para el visualizador
npm run assets                           # publica catálogo (y audios en local/.published) desde las fuentes; corre solo antes de dev y build
npm run upload-audio                     # sube .published/ al bucket "audio" de Supabase Storage (-- --prune borra lo viejo)
supabase/tests/run.sh                    # prueba el schema contra un Postgres descartable
```

> **Después de cada `npm run catalog` hay que correr `npm run compress-audio` y después
> `npm run peaks`**, en ese orden: el catálogo baja previews de 30 s stereo, el juego solo usa
> 16 s mono, y las envolventes se calculan sobre el audio ya recortado. Ver sección Audio.

Variables en `.env` (no está en git, ver `.env.example`):

| Variable | Quién la usa |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Solo `npm run catalog`. Nunca llegan al browser. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Rondas, ranking y mails. Vacías = modo local (solo desarrollo). |
| `AUDIO_KEY_SECRET` | `npm run assets`: nombres opacos de los mp3. **Obligatoria en producción y con Supabase**; sin ella el build falla. Nunca llega al browser. Cambiarla renombra todos los audios (ver "Rotar el secreto"). |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo `npm run upload-audio`. Jamás con prefijo `VITE_`. |
| `SUPABASE_DB_PASSWORD` | Correr SQL contra el proyecto con `psql` (ver sección Supabase). |

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
| Cómo se elige el tema (Supabase) | `start_round` en `supabase/schema.sql` (evita los últimos 20 del jugador) |
| Cómo se elige el tema (modo local) | `src/catalog/pickTrack.js` (`RECENT_LIMIT`, clave `heardle:recent`) vía `src/rounds/localRounds.js` |
| Reglas del servidor: rondas, ranking, alias, mails, límites | `supabase/schema.sql` + `supabase/tests/secure_rounds.test.sql` |
| Qué servicio se usa (Supabase o local), login anónimo | `src/services/gameServices.js`, `supabaseServices.js` |
| Rondas: puerto y las dos implementaciones | `src/rounds/localRounds.js`, `supabaseRounds.js`; textos de error en `roundErrors.js` |
| Qué ve el browser del catálogo y los audios | `scripts/publish-assets.mjs` + `scripts/lib/publish.mjs` |
| Subida de audios y envolventes a Storage | `scripts/upload-audio.mjs`; el bucket lo crea `supabase/schema.sql` |
| De dónde carga el browser audios y envolventes | `src/services/assetUrls.js` |
| Headers de seguridad (CSP y demás) | `vercel.json` |
| Ranking del buscador, cuántos resultados, normalización de acentos | `src/catalog/search.js` |
| Cómo se cargan y mezclan los JSON del catálogo | `src/catalog/loadCatalog.js` |
| Reproducción: cuándo arranca, cuándo corta, anillo de progreso | `src/audio/useAudioPlayer.js` |
| Flujo general, qué se muestra cuando, orden de paneles, localStorage de filtros | `src/containers/GameContainer.jsx` |
| Pantalla de juego (círculo, contador, buscador, skip, historial) | `src/components/organisms/GameBoard.jsx` y las moléculas que usa |
| Círculo de play, latido del isotipo | `src/components/molecules/PlayCircle.jsx` |
| Anillo de onda (compartido por juego y reveal): geometría, barrido al desbloquear, respiración constante | `src/components/molecules/WaveRing.jsx` (`TICK_BASE`, `TICK_REACH`, `SWEEP_STEP_MS`, `BREATH_MS`, `BREATH_WAVES`) + `tick-breathe` en `index.css` |
| Animaciones (entrada de palabras, contador que rueda, disco, stagger) | `src/index.css` (`word-rise`, `roll-in`, `rise`, `disc-in`, `disc-spin`, `--ease-out-expo`) |
| Cómo se calculan los ticks del anillo y cuántos están desbloqueados | `src/audio/waveform.js` (`ringTicks`, `unlockedTicks`, `RING_TICKS`, `CLIP_FILE_SECONDS`) + `waveform.test.js` |
| Sacudón al errar, grano animado del fondo | `GameBoard.jsx` (`MISS_SHAKE`) · `src/index.css` (`grain`, `body::before`) |
| Escalera de intentos en la columna derecha (layout ancho) | `src/components/molecules/GuessHistory.jsx` (`variant="ladder"`) |
| Envolventes de onda por tema | `scripts/build-peaks.mjs` → `data/peaks.json` (publicado por clave de audio) |
| Autocomplete (teclado, ARIA, dropdown) | `src/components/molecules/GuessSearch.jsx` |
| Barra de segmentos arriba | `src/components/molecules/StageProgress.jsx` + `atoms/Segment.jsx` |
| Historial de intentos (cruz roja, "Salteado") | `src/components/molecules/GuessHistory.jsx` |
| Chips de artistas, línea de ajustes colapsable | `src/components/molecules/GameSettings.jsx` |
| Botones grandes del reveal (relleno que barre, ícono que se mueve) | `src/components/atoms/ActionButton.jsx` |
| Reveal final (disco girando, anillo, puntaje, share, jugar otra vez) | `src/components/organisms/ResultReveal.jsx`; el autoplay del tema está en `GameContainer.jsx` |
| Ranking, formulario de alias, cuántas filas entran (`TOP_ROWS`) | `src/components/organisms/Leaderboard.jsx` |
| Captura de mail | `src/components/organisms/EmailCapture.jsx` |
| Validación de alias, id anónimo | `src/player/playerIdentity.js` (`ALIAS_MIN`, `ALIAS_MAX`) |
| Ranking (Supabase o local) | `src/leaderboard/supabaseAdapter.js`, `localAdapter.js`; la interfaz común está en `src/services/gameServices.js` |
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
| Reintentos ante cortes de conexión (cuántos, backoff, qué se reintenta) y timeout por pedido | `src/shared/retry.js` (`withRetry`, `shouldRetry`, `withTimeout`) + `callJudge` y `REQUEST_TIMEOUT_MS` en `GameContainer.jsx` |
| Qué rondas suman al ranking (todos o 3+ artistas, primera vez por tema) | `src/leaderboard/ranking.js` (`MIN_ARTISTS_RANKED`, `isRankedSelection`, `isRankedRound`) + `start_round` en `supabase/schema.sql` |
| Explicación del ranking en la UI ("Cómo funciona") | `src/components/organisms/Leaderboard.jsx` (`RULES`) |
| Sesión anónima vencida o usuario borrado | `src/services/supabaseServices.js` + `src/services/session.js` |
| Stub de localStorage para los tests | `src/test-utils/localStorage.js` |

## Flujo de datos (leer una vez)

**El servidor es el árbitro** (desde 2026-09-23, `odd/tasks/secure-rounds.md`). El browser nunca
sabe qué tema está sonando hasta que termina la ronda.

1. `GameContainer` monta, llama a `loadCatalog()` (lee `public/catalog/`, generado por
   `npm run assets`), mezcla y deduplica por ISRC. Ese catálogo sirve para el buscador y el reveal:
   **no tiene ningún dato que conecte un tema con su audio**.
2. `getGameServices()` elige el modo. Con `VITE_SUPABASE_*`: login anónimo de Supabase (la sesión
   queda en `heardle:auth`) y todo por funciones de Postgres. Sin ellas: modo local, que imita las
   mismas reglas en el browser y solo sirve para desarrollo.
3. `rounds.start(filtro)` devuelve la **vista de la ronda**: `{ id, audioKey, stages, stageIndex,
   attempts, status, score, answerId }`. `answerId` es `null` mientras se juega. Si hay una ronda
   abierta, devuelve esa: **nunca se reparte otra** (recargar para cambiar un tema difícil no
   sirve). Por eso cambiar los artistas a mitad de ronda aplica desde la próxima, y lo dice.
4. Play: `useAudioPlayer(audioUrl(audioKey))` (Storage con Supabase, `/audio/` en local) reproduce desde 0 hasta
   `currentClipSeconds(game)`. El corte lo hacen un `setTimeout` armado en `onplaying` y el evento
   `timeupdate`; el `requestAnimationFrame` solo dibuja el anillo (ver Gotchas).
5. Guess → `rounds.guess(id, trackId, attempt)`; skip → `rounds.skip(id, attempt)`, donde
   `attempt` es cuántos intentos vio el cliente: si el servidor ya lo registró (se perdió la
   respuesta), el reintento no cuenta doble. Los cortes de conexión se reintentan solos, y un
   pedido que no contesta en 10 s cuenta como corte (`callJudge`: timeout + reintento, también
   para arrancar la ronda, el ranking y el login inicial). Si igual falla la carga, la pantalla de
   error tiene un botón "Reintentar". Si el mp3
   no carga, se avisa y tocar el círculo lo reintenta. Una acción por vez (`busy`); la
   ronda solo cambia con la respuesta del árbitro. Un error se muestra arriba del buscador.
6. Al terminar, la ronda ya quedó registrada por quien la arbitró; el contenedor solo refresca el
   ranking. `ResultReveal` **reemplaza** al `GameBoard` y busca el tema en el catálogo por
   `answerId`. Desde ahí se llega al `Leaderboard`, que es otra vista.

Score: si ganás, `stages.length - índice del stage ganador` (acertar de una = 4 puntos, en el
último intento = 1). Perder = 0. La definición única es `scoreFor(won, stageWon)` en el motor.

**El puntaje nunca viene del cliente** (desde 2026-09-22, `odd/tasks/fair-ranking.md`). El
browser manda solo el resultado (`won`, `stageWon`, `attempts`). En Supabase `games.score` es
una **columna generada** y hay checks que rechazan una ronda imposible; mandar `score` en el
insert da error. El adapter local lo deriva igual con `scoreFor`. Si cambiás `STAGES` o la
fórmula, cambiala también en `supabase/schema.sql` (el 4 está escrito ahí).

**Solo suman al ranking las rondas con todos los artistas o con 3 o más** (desde 2026-09-23,
`odd/tasks/third-review-fixes.md`). Con un solo artista (Dazen tiene 9 temas) adivinar es mucho
más fácil e inflaba el promedio. Las otras rondas se juegan y se puntúan igual, pero no entran al
promedio ni a "te faltan N partidas"; el panel de artistas y el reveal lo avisan. Tres porque los
principales del sello son tres (Ramma, ARA, Valuto) y la gente escucha a los tres. Lo decide el
servidor (`rounds.ranked` en `start_round`; solo cuentan slugs que existen); el modo local lo imita.

**El ranking es por promedio, con mínimo de 5 partidas** (`rankPlayers`, `MIN_GAMES` en
`src/leaderboard/ranking.js`; la función SQL `get_leaderboard` repite la misma regla con `having`).
Por total ganaba el que más jugaba, no el que mejor adivinaba. Empate de promedio: primero el que
tiene más partidas. Solo aparecen jugadores con alias. Debajo del mínimo, la vista del ranking
dice cuántas partidas faltan (`getPlayerStats`).

**Cada tema suma al ranking solo la primera vez que lo jugás** (desde 2026-09-23,
`odd/tasks/ranking-first-play.md`). Perder revela el tema: la próxima vez que te toca lo acertás
de una, y eso inflaba el promedio sin haber adivinado nada — era el ítem abierto de más abajo.
`start_round` en `supabase/schema.sql` exige, además de la regla de selección, que el jugador no
tenga ya una ronda (cualquier estado) con ese `track_id`; hay un backfill idempotente
(`private.backfill_ranked_first_play`) para las filas que quedaron marcadas antes de esta regla.
El modo local lo imita: `hasPlayed` en `localAdapter.js` mira `heardle:local:games`, y
`isRankedRound` en `ranking.js` combina las dos condiciones. El reveal recién dice que un tema no
suma por ser repetido **al terminar la ronda**, nunca antes: avisarlo mientras jugás delataría que
ya la escuchaste. El ranking tiene un panel "Cómo funciona" (`Leaderboard.jsx`) que explica las
reglas sin scrollear, con un toggle que reemplaza la tabla.

Lo que sigue abierto: el login anónimo no tiene CAPTCHA todavía (ver "Puesta en marcha" en
Supabase), así que alguien podría crear muchas cuentas para seguir sumando primeras veces. La
regla de arriba cierra el abuso dentro de una misma cuenta; entre cuentas, el freno pendiente es
ese CAPTCHA.

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

**Fuentes vs. lo publicado.** `data/catalog/<slug>.json` va a git. `audio/<ISRC>.mp3` y
`data/peaks.json` (por ISRC) son fuentes **locales, fuera de git**: el repo es público y, junto a
los archivos publicados, darían todas las respuestas (el mp3 publicado es el mismo archivo; los
picos publicados son los mismos números). Se sacaron también del historial de la rama antes del
primer push (2026-09-23, `odd/tasks/review-followups.md`). Se regeneran con `npm run catalog` +
`compress-audio` + `peaks`; conviene tener un backup propio.

Lo generado por `npm run assets` (todo en `.gitignore`): `public/catalog/` siempre; con secreto,
`.published/audio/<key>.mp3` + `.published/peaks.json` para subir a Storage; sin secreto (modo
local), `public/audio/` y `public/catalog/peaks.json`; y `supabase/.generated/tracks.sql`. En
Vercel no hay fuentes: solo se publica el catálogo.

**Rotar el secreto** (invalida una tabla clave → respuesta armada entre jugadores; una tabla por
hash de los bytes sobrevive, es el límite aceptado): nuevo `AUDIO_KEY_SECRET` → `npm run assets` →
`npm run upload-audio` → cargar `tracks.sql` → `npm run upload-audio -- --prune`. Las rondas
abiertas siguen andando: la vista toma la clave nueva de `tracks`.

**Track en `data/catalog/<slug>.json`** (lo genera el script, no editar a mano salvo para corregir un dato puntual). La versión publicada es igual pero **sin `audio_file` ni `deezer_id`**, y con `audio_key` solo en modo local:

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

`data/catalog/index.json` (publicado tal cual): `[{ "slug", "name", "tracks" }]`. La app lee el índice de forma dinámica: agregar un artista es correr el script, no tocar código.

**Track en memoria** (lo que ven los componentes, sale de `loadCatalog`): `{ id, title, artists, artistSlugs, audioFile, coverUrl, spotifyUrl, release, releaseDate }`. Ojo con el camelCase: el JSON usa snake_case, la app camelCase, la conversión está en `loadCatalog.js`.

**Puertos** (`src/services/gameServices.js`): `rounds` = `start(artistSlugs)`, `guess(roundId, trackId, attempt)`, `skip(roundId, attempt)`, todos devuelven la vista de la ronda (`{ id, audioKey, stages, stageIndex, attempts, status, score, ranked, answerId, answer }`). `attempt` es `attempts.length` como lo vio el cliente: obligatorio (sin él, `invalid_attempt`), y es lo que hace seguro reintentar. `board` = `getTop(limit)` → `[{ alias, gamesPlayed, totalScore, avgScore }]` ya filtrado y ordenado, `getPlayerStats()` → `{ alias?, gamesPlayed, totalScore, avgScore }`, `setAlias(alias)` → el alias tal como quedó guardado, `subscribeEmail(email)`. Nadie manda puntaje ni `playerId`: en Supabase el jugador es `auth.uid()`.

**localStorage** (todas las claves con prefijo `heardle:`): `auth` (sesión anónima de Supabase), `alias` (copia del servidor), `artistFilter`, `emailPrompt` (`pending | done | dismissed`); en modo local además `playerId`, `recent`, `local:round` (la ronda abierta), `local:games`, `local:aliases`, `local:emails`. Quien jugó antes del 2026-09-18 puede tener todavía un `heardle:difficulty` huérfano; no se lee más y no molesta.

## Catálogo

`scripts/build-catalog.mjs`, por artista de `data/artists.json`:

1. Spotify: lista álbumes, singles y apariciones del artista y se queda con los tracks donde está acreditado. Después pide cada track de a uno para sacar el ISRC y el link.
2. Deezer: resuelve el track por ISRC (`/2.0/track/isrc:XXX`), fallback por título + artista. Deezer no necesita token.
3. Descarga la preview de 30 s a `audio/<ISRC>.mp3`. **Hay que descargarla**: las URLs de preview de Deezer están firmadas y expiran.
4. Escribe `data/catalog/<slug>.json`, `index.json` y `data/missing.json` (temas sin preview, para completar a mano bajando de YouTube).

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
Tan Bien. Para sumarlas hay que conseguir el audio a mano y dejarlo en `audio/<ISRC>.mp3` y correr `npm run assets` (y recargar el seed en Supabase).

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
- **El isotipo nunca cambia de color: siempre blanco (`bg-fg`).** Es el logo de GACETA y no se
  toca. Mientras suena solo late (escala); el acid gold va en el anillo, no en la marca.
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

**El anillo es el tema.** Alrededor del círculo hay 64 ticks radiales: la envolvente real de los
primeros 8 s (la última etapa). Lo desbloqueado se ve blanco, lo que falta espera apagado. Cada
fallo o skip desbloquea más y los ticks nuevos entran en barrido (apagado → acid gold → blanco,
`.tick-unlock`). Mientras suena, el playhead pinta de acid gold lo que ya pasó y el isotipo del
centro late con el nivel. Reemplazó a las cinco barras del centro y al anillo de progreso de 2px
(2026-09-22, `odd/tasks/game-energy.md`).

**La decisión importante: no se usa `AnalyserNode`.** `createMediaElementSource` captura la salida
del elemento de audio de forma **permanente** — si el `AudioContext` queda suspendido, el juego se
queda mudo y no hay vuelta atrás. Verificado en esta máquina: `ctx.resume()` directamente cuelga en
una pestaña oculta. Arriesgar el audio, que es el producto entero, por un efecto visual es un mal
negocio.

En su lugar:

1. `scripts/build-peaks.mjs` decodifica cada mp3 a PCM mono 8 kHz con ffmpeg y lo reduce a **64
   valores RMS** (0–255), normalizados contra el pico del propio tema para que los temas bajos
   también llenen el anillo. Sale `data/peaks.json` (por ISRC; `npm run assets` lo publica por clave de audio): con 431 temas son 107 KB crudos / **39 KB gzip**.
2. **`loadPeaks()` es una función aparte y NO se espera junto al catálogo.** Con 431 temas,
   `peaks.json` pesa 39 KB gzip: la mitad de todo lo que se baja al arrancar, para decoración. Que
   eso se interponga entre el jugador y la primera ronda estaría mal. `GameContainer` dispara las
   dos cargas en paralelo y las barras llegan cuando llegan. Si falla, resuelve a `{}` y las barras
   quedan planas; nunca rechaza.
3. `src/audio/waveform.js` es **pura y testeada**: `ringTicks(peaks, span)` interpola la envolvente
   y la normaliza contra lo más fuerte **dentro de los 8 s**, así una intro baja igual llena el
   anillo. `CLIP_FILE_SECONDS = 16` tiene que coincidir con `CLIP_SECONDS` de `compress-audio`.
   `barHeights` sigue existiendo: el hook la usa para sacar el nivel del momento (la barra del medio)
   y de ahí sale el latido.
4. El tick de `requestAnimationFrame` de `useAudioPlayer` actualiza nivel y progreso. **Es solo visual**: el
   corte del fragmento sigue dependiendo de `setTimeout` + `timeupdate`, como siempre.

Dos detalles que no conviene deshacer:

- El latido es **`scale`, no tamaño**: nada hace reflow a 60fps. El sacudón es Web Animations
  (`element.animate`) sobre el contenedor del círculo, no una clase, para no remontar nada.
- Los ticks **respiran siempre**: la punta se retrae y vuelve, desfasada entre vecinos, así una
  onda lenta recorre el anillo. Se hace con `stroke-dashoffset` sobre `pathLength={1}`, no con
  `scale`, para que la base del tick quede pegada al círculo. Reemplazó a un brillo que recorría
  los ticks bloqueados, que al usuario no le gustó. Barrido y respiración van juntos en el
  `animation` inline de cada tick: con dos clases, una pisaría a la otra.
- `levelFromBar` (en `waveform.js`) deshace el piso `MIN_HEIGHT` de las barras para el latido.
- `tick-unlock` usa `animation-fill-mode: backwards` **a propósito**: con `both` la animación se
  quedaría con el color final y taparía el acid gold del playhead en esos ticks.
- Con `prefers-reduced-motion`: el isotipo no late, no hay sacudón, el anillo no respira y el grano queda quieto.

**Jerarquía de acciones del reveal:** primero "Jugar otra vez" (acid gold, más ancho), después
Spotify (en el verde de Spotify, `--color-spotify`, la única excepción a la paleta y solo en ese
botón: lo pidió el usuario), y compartir como link chico abajo. Es pedido del usuario: lo que tiene que
invitar es volver a jugar y escuchar el tema. `hoverOnlyWhenSupported` está prendido en
`tailwind.config.js` para que en celular el hover no quede pegado después de un toque.

**El reveal es un disco.** Al terminar la ronda suena el tema (16 s, el clip entero) y la carátula
gira como un vinilo dentro del mismo anillo, ahora con los 16 s; lo que necesitaste para acertar
queda en acid gold. Tocar el disco lo pausa o lo vuelve a arrancar. El giro usa
`animation-play-state: paused` para que el disco se quede en su ángulo al parar en vez de volver a
cero. Ir al ranking corta el audio. El autoplay depende de que el navegador cuente la página como
activada (el guess fue un click); si igual lo rechaza, el disco queda quieto esperando un toque.

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
    (`variant="panel"` en `GameSettings`), juego al medio, escalera de intentos a la derecha.
    **La grilla es de `GameBoard`**, no del contenedor: recibe `left` y `right` y los pone en la
    fila del círculo, así los tres quedan centrados sobre la misma línea. El header de `App.jsx`
    usa las mismas tres columnas, así el logo arranca donde la columna de artistas y
    `esgaceta.com` termina donde la escalera. En ancho no hay barra de segmentos arriba: la
    escalera ya es el progreso. Si cambiás el ancho de una columna, cambialo en los dos lados. El marco pasa a
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
128 kbps, pero el juego escucha como máximo 8 s mientras adivinás (la última de `STAGES` en
`engine.js`) y 16 s en el reveal, así que se recortan a 16 s mono 96 kbps. Medido sobre los 431 temas: **~197 MB → 81 MB (-60%)**, de 480 KB a
188 KB por tema. Eso es lo que se ahorra el que juega desde el celular en cada reproducción.

- **Los originales se guardan en `audio-raw/`**, que está en `.gitignore`. Son la fuente para
  volver a comprimir con otros parámetros sin gastar cuota de Spotify ni volver a bajar de Deezer.
- **Es idempotente.** Detecta lo ya comprimido (mono y ≤ 16,5 s) y lo saltea. Correrlo de nuevo
  después de `npm run catalog` solo toca los temas nuevos.
- Flags: `--dry`, `--force`, `--seconds=20`, `--bitrate=128k`.
- **`audio/` (las fuentes, por ISRC) NO va a git** (ver "Fuentes vs. lo publicado"). En producción
  los mp3 se sirven desde Supabase Storage, no desde Vercel. Ojo con el egress del plan de
  Supabase si juega mucha gente: cada ronda baja hasta ~190 KB.

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

**Proyecto en uso:** `heardle-gaceta`, ref `vqdqftckujawjkllrclk`, organización "Gaceta", región
São Paulo (creado el 2026-09-23 con el CLI). Schema y seed cargados; logins anónimos activados y
registro por email desactivado (el juego no lo usa) vía `supabase config push`. La contraseña de
la base, la anon key y `AUDIO_KEY_SECRET` están en `.env` (git-ignored). El CLI quedó linkeado:
`supabase/.temp/pooler-url` sirve para correr SQL con `psql` y `PGPASSWORD=$SUPABASE_DB_PASSWORD`.
`supabase/tests/smoke.mjs` prueba el flujo completo contra este proyecto (ver cabecera del archivo).

Puesta en marcha de un proyecto nuevo:

1. Authentication → habilitar **Anonymous sign-ins**. Antes de lanzar, activar también el
   **CAPTCHA** (Turnstile o hCaptcha) para esos logins: sin eso, un bot puede crear jugadores sin
   límite. Supabase ya limita los logins anónimos por IP.
2. SQL editor → correr `supabase/schema.sql`. Se puede volver a correr: todo es `if not exists` /
   `create or replace`.
3. Con `AUDIO_KEY_SECRET` en `.env`, `npm run assets` → `npm run upload-audio` (necesita
   `SUPABASE_SERVICE_ROLE_KEY`) → pegar `supabase/.generated/tracks.sql` en el SQL editor. **Ese
   archivo es la respuesta de todas las rondas: no se commitea ni se comparte.** Hay que volver a
   cargarlo si cambia el catálogo o el secreto.
4. Cargar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `AUDIO_KEY_SECRET` en `.env` y en Vercel.

Modelo de seguridad (detallado arriba de `schema.sql`): ninguna tabla es legible ni escribible
desde el cliente (RLS sin políticas + `revoke`); todo pasa por funciones `security definer` que
solo actúan sobre las filas del que llama; el puntaje es una columna generada; hay tope de 60
rondas por hora, un mail por jugador, y alias validado (forma, palabras bloqueadas como palabra
entera, único sin importar mayúsculas). Palabras bloqueadas: `insert into public.blocked_words`.

`supabase/tests/run.sh` levanta un Postgres descartable, simula lo que Supabase provee
(`auth.uid()`, roles `anon`/`authenticated` con sus grants por defecto) y prueba todo eso; también
carga el seed generado. **Lo que no prueba:** el login anónimo real ni PostgREST. Eso se verifica
recién con un proyecto (o `supabase start`, que necesita Docker).

**Orden de despliegue.** Si un cambio en `schema.sql` cambia la firma de una función (como pasó
con `guess_round`/`skip_round` al sumar `p_attempt`), la vieja se borra: un browser con el bundle
anterior recibe "function not found" hasta recargar. Aplicar el schema y deployar el cliente
juntos, o dejar la firma vieja hasta que el bundle nuevo esté en producción.

Límite aceptado: alguien que juegue los 431 temas puede reconocer cada mp3 por sus bytes y armarse
una tabla. No se puede frenar con código.

## Cómo verificar un cambio

1. `npm run test` — tiene que dar **175/175** en 17 archivos (o más si agregás tests). El `include` de vitest cubre `src/**/*.test.js` y `scripts/**/*.test.mjs`, así que el tooling de build se testea donde vive.
2. `npm run build` — tiene que compilar.
   Lint: el `eslint.config.js` de la raíz **ignora `heardle-gaceta/`**, así que un `eslint` común
   no revisa nada acá. Desde la raíz: `npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts`.
   Ojo que `no-unused-vars` deja pasar nombres en mayúsculas (`^[A-Z_]`).
   SQL: `supabase/tests/run.sh`. Contra el proyecto real: `supabase/tests/smoke.mjs`.
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
- **React StrictMode en dev** duplica efectos. Ya no hay efecto que registre partidas: la ronda la registra quien la arbitra, y cada intento viaja con su `attempt`, así que un duplicado no cuenta doble.
- `GuessSearch` lleva `key={game.id}` (el id de la ronda) para vaciar el texto al cambiar de ronda. Si lo sacás, el texto queda pegado entre rondas.
- Si elegís un tema mientras el intento anterior todavía viaja, `onGuess` devuelve `false` y el buscador conserva el texto: el tema no se pierde.
- Los mp3 publicados se llaman por `HMAC(AUDIO_KEY_SECRET, ISRC)`: ni el nombre ni el catálogo dicen qué tema es. Nunca servir `audio/` ni `data/catalog/` directamente.
- Cambiar `tailwind.config.js` (por ejemplo, un color nuevo) pide reiniciar `npm run dev`.
- La carátula solo se muestra en el reveal. No mostrarla antes. En el reveal va recortada en círculo (es un disco): es a propósito.

## Backlog (avisos del review, no bloqueantes)

Los cuatro ítems de código se cerraron el 2026-09-18 (ver `odd/tasks/backlog-cleanup.md`):

- ~~`loadCatalog` usa `Promise.all`~~ → ahora `Promise.allSettled`. Un JSON de artista caído ya no
  tumba el catálogo: se juega con lo que cargó y ese artista **desaparece de los chips**, para no
  ofrecer una selección sin temas. Solo falla si no carga ninguno.
- ~~`useAudioPlayer` sin guard de play~~ → token de generación en `playIdRef`. `stop()` lo incrementa
  e invalida cualquier play en vuelo; el loop de `requestAnimationFrame` huérfano se retira solo.
  Además `ready` ahora llega a `PlayCircle` como `loading`: anillo pulsando, glifo atenuado y
  `aria-busy`, sin costar una fila de alto.
- ~~Errores de `submitGame` silenciados~~ → `withRetry` (hoy en `src/shared/retry.js`), 3 intentos con
  backoff exponencial, y si igual falla lo dice en el reveal con un botón de reintento.
- ~~Faltan tests~~ → 62 tests en 7 archivos. Nuevos: `loadCatalog`, `search`, `pickTrack`,
  `playerIdentity`, `localAdapter`, `retry`.

Los assets de marca también se cerraron (2026-09-18): salieron de `Gaceta-web/public/assets/logos/`,
ver la sección **Marca**.

**Deploy (2026-09-23):** proyecto `heardle-gaceta` en el team **GACETA** de Vercel, en producción
en `https://heardle-gaceta.vercel.app`. Se deploya por CLI desde `heardle-gaceta/`
(`vercel deploy --prod --scope gaceta-97ec2001`); `.vercelignore` deja afuera `.env` y todo lo que
conecta un tema con su audio. Sus rutas van ancladas con `/`: un `audio` suelto también excluía
`src/audio/` y rompió el primer build. Variables cargadas en production y preview:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `AUDIO_KEY_SECRET`.

**Lo que sigue abierto, porque depende de vos:** dominio propio (con eso hay que pasar `og:image`
a URL absoluta), el CAPTCHA del login anónimo y completar los temas sin preview.

Encontrado y arreglado de paso: entre que cargaba el catálogo y arrancaba la ronda se veía un
instante **"No hay temas para esa selección"** aunque había 209. Ese mensaje ahora solo aparece
cuando `poolSize === 0` de verdad; si no, va un spinner.

## Review nativo (Gentle AI, receipt-driven development)

Está activado globalmente. Después de un cambio, el flujo es: `gentle-ai review status --cwd <raíz del repo Gaceta-web> --contract gentle-ai.review-integration/v2 --agent claude-code --next-transition` y seguir el `next_transition` que devuelve. Cosas que ya pasaron y conviene saber:

- La raíz del repo git es `Gaceta-web/`, no `heardle-gaceta/`. Todo el subproyecto está sin trackear, así que el review pide una **selección de archivos untracked**: pasar `--untracked-scope select --expected-untracked-inventory <digest del status> --intended-untracked=<ruta> …`. Excluir `audio/` y `data/peaks.json` (no van a git: ver "Fuentes vs. lo publicado"), `.published/`, `audio-raw/`, `.env`, `data/cache/`, `data/missing.json`, `package-lock.json` y el brief.
- Si un fix agrega un archivo nuevo que no estaba en la selección congelada, el review responde `corrected_candidate_unavailable`. Se resuelve con `gentle-ai review recover --disposition scope_changed` (pide autorización del usuario) y una lineage sucesora.
- El primer `status` con selección a veces da `operation_timeout` transitorio. Reportado en gentle-ai#1833. Un reintento idéntico suele andar.
