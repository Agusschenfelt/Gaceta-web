# CLAUDE.md — Heardle GACETA

Guía para trabajar en este subproyecto. Leela entera antes de tocar código: está pensada para que puedas hacer fixes chicos sin explorar el repo.

## Qué es

Juego tipo Heardle/Songly con el catálogo del sello GACETA. Una sola pantalla: escuchás un fragmento corto, adivinás el tema con un buscador, cada fallo o skip alarga el fragmento. Al terminar se revela el tema, se comparte el resultado y, a partir de la segunda ronda jugada, la reveal ofrece dejar el mail para novedades. Brief original en `brief-heardle-gaceta.md`.

Vive dentro del repo de la web de GACETA (`Gaceta-web/heardle-gaceta/`) pero es un proyecto Vite independiente con su propio `package.json`. No comparte código con la web, solo la identidad visual.

## Comandos

```bash
npm install --legacy-peer-deps   # siempre con --legacy-peer-deps
npm run dev                      # Vite en http://localhost:5173
npm run test                     # vitest, entorno node: src/**/*.test.js, scripts/**/*.test.mjs y api/**/*.test.js
vercel dev                       # opcional: sirve api/ junto con Vite (ver "Servidor"); npm run dev solo = modo local, sin servidor
npm run build                    # build a dist/
npm run catalog                  # arma el catálogo (ver sección Catálogo)
npm run catalog -- --only ramma,valuto   # solo esos artistas
npm run catalog -- --dry                 # sin escribir nada
npm run compress-audio                   # recorta los mp3 nuevos a 16 s mono 96k
npm run compress-audio -- --dry          # sin escribir nada
npm run peaks                            # envolventes de onda para el visualizador
npm run assets                           # publica catálogo (y audios en local/.published) desde las fuentes; corre solo antes de dev y build
npm run upload-audio                     # sube .published/ a Vercel Blob (-- --prune borra lo viejo; -- --dry no sube nada)
```

> **Después de cada `npm run catalog` hay que correr `npm run compress-audio` y después
> `npm run peaks`**, en ese orden: el catálogo baja previews de 30 s stereo, el juego solo usa
> 16 s mono, y las envolventes se calculan sobre el audio ya recortado. Ver sección Audio.

Variables en `.env` (no está en git, ver `.env.example`):

| Variable | Quién la usa |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Solo `npm run catalog`. Nunca llegan al browser. |
| `VITE_ROUNDS_API` | Pública (build). `true` = el browser juega por `api/` (producción). Vacía = modo local, solo desarrollo. |
| `VITE_AUDIO_BASE_URL` | Pública (build). Base del store de Blob: `https://<store-id>.public.blob.vercel-storage.com/audio`. Obligatoria en un build deployado con la API prendida. |
| `VITE_TURNSTILE_SITE_KEY` | Pública (build). Site key de Cloudflare Turnstile; protege la suscripción de mails. Vacía = sin captcha, anda igual en dev/local. Ver "Captcha". |
| `AUDIO_KEY_SECRET` | `npm run assets` **y** las Functions de `api/`: nombres opacos de los mp3 (`HMAC(secret, ISRC)`). **Obligatoria en producción y con la API prendida**; sin ella el build o la función fallan. Nunca llega al browser. Cambiarla renombra todos los audios (ver "Rotar el secreto"). |
| `ROUND_TOKEN_SECRET` | Solo `api/`. Clave del token AES-256-GCM de la ronda. Cualquier string largo y al azar. |
| `DATABASE_URL` | Solo `api/subscribe`. La Neon compartida de GACETA (tabla `public.subscribers`). |
| `TURNSTILE_SECRET_KEY` | Solo `api/subscribe`. Secret key de Turnstile; obligatoria una vez deployado. |
| `RESEND_API_KEY` | Solo `api/subscribe`. Mail de bienvenida; si falta, la suscripción anda sin mail. |
| `BLOB_READ_WRITE_TOKEN` | Solo `npm run upload-audio`. |

Regla: nada secreto con prefijo `VITE_`; lo que lleva `VITE_` termina en el bundle del browser.

## Stack y reglas duras

- React 19 + Vite 6 + Tailwind 3 + Vitest. El browser no trae ningún SDK de backend: habla con `api/` por `fetch`. Las únicas dependencias de servidor son `@neondatabase/serverless` (solo `api/subscribe`) y `@vercel/blob` (dev, solo el script de subida).
- **No agregar dependencias.** Nada de GSAP, router, framer-motion ni librerías de UI. El juego tiene que ser liviano.
- **Código, identificadores y comentarios en inglés.** Copy de UI en español neutro con voseo suave ("Adiviná el tema", "Escuchá", "Compartí"). Sin lunfardo.
- **Colores y fuentes solo por tokens.** Nunca un hex en un componente. Todo sale de `src/theme/tokens.css` y de las clases Tailwind mapeadas en `tailwind.config.js` (`bg`, `fg`, `muted`, `accent`, `danger`, `surface`, `border`, `font-sans`, `font-display`).
- **El motor (`src/game/engine.js`) es puro.** Sin React, sin DOM, sin localStorage. Cualquier regla nueva del juego va ahí y se testea en `engine.test.js`.
- **Mobile-first**, una sola columna, sin scroll horizontal. Respetar `prefers-reduced-motion`.
- **Identidad visual** (heredada de la web de GACETA): fondo `#0a0a0a` con noise, texto blanco, acento acid gold `#dee5a0` usado con moderación (ring del play, estados correctos, foco), rojo `#911e1e` para errores. Inter bold con tracking apretado para títulos, Instrument Serif italic para una palabra de contraste. Nada de gradientes, glow ni glassmorphism.

## Dónde tocar según lo que quieras cambiar

| Querés cambiar… | Archivo |
|---|---|
| Duraciones de los stages por nivel y cómo se calcula el score | `src/game/engine.js` (`LEVELS`, `DEFAULT_LEVEL`, `STAGE_COUNT` arriba de todo) + `engine.test.js`. El árbitro (`api/_lib/arbiter.js`) usa el motor directamente: no hay una segunda copia que tocar. Si una etapa pasa de 16 s, leer la sección Audio |
| Nivel: selector, etiquetas "Normal"/"Difícil", cómo aparece en el reveal y el share | `GameSettings.jsx` (selector), `src/game/format.js` (`levelLabel`), `ResultReveal.jsx`, `src/game/share.js`; guardado en `GameContainer.jsx` (`heardle:level`). Reglas del servidor: `start` en `api/_lib/arbiter.js` (el nivel viaja en el token) |
| Qué layout se usa según el ancho | `src/containers/GameContainer.jsx` (`isWide`) + `src/hooks/useMediaQuery.js` |
| Largo del recorte de los mp3, bitrate, dónde quedan los originales | `scripts/compress-audio.mjs` (`CLIP_SECONDS`, `BITRATE`) |
| Cuánto silencio inicial se recorta y con qué umbral | `scripts/compress-audio.mjs` (`ONSET_THRESHOLD`, `LEAD_IN`, `MAX_TRIM`) + `scripts/lib/onset.mjs` (`SILENCE_FLOOR`) |
| Texto y emojis del share | `src/game/share.js` |
| Cómo se elige el tema (API) | `api/_lib/arbiter.js` (`MAX_EXCLUDED`, evita los últimos 20 que manda el cliente) + `api/_lib/trackPool.js` (pool y claves de audio) |
| Cómo se elige el tema (modo local) | `src/catalog/pickTrack.js` (`RECENT_LIMIT`, clave `heardle:recent`) vía `src/rounds/localRounds.js`; la lista de recientes está en `src/catalog/recentTracks.js` |
| Reglas del servidor: rondas, transiciones, errores | `api/_lib/arbiter.js` (+ `arbiter.test.js`), `api/_lib/http.js` (códigos y status), `api/rounds/{start,guess,skip}.js` |
| Token de la ronda (formato, vencimiento, clave) y configuración del servidor | `api/_lib/roundToken.js` (`TOKEN_TTL_MS`), `api/_lib/config.js` |
| Mails: validación, Turnstile, inserción, bienvenida | `api/_lib/subscribe.js` + `api/subscribe.js`; texto, diseño (tablas + estilos inline), remitente y reply-to en `api/_lib/welcomeMessage.js`. Las imágenes del mail son PNG en `public/email/` (exportadas de `public/assets/`; webp no anda en Outlook) y se piden por URL absoluta a `heardle.esgaceta.com/email/`: deployar antes de cambiarlas |
| Qué servicio se usa (API o local) | `src/services/gameServices.js` (`VITE_ROUNDS_API`) |
| Captcha (Turnstile) de la suscripción | `src/services/captcha.js` (`getCaptchaToken`) + `src/leaderboard/apiAdapter.js` + `frame-src`/`script-src` en `vercel.json` |
| Rondas: puerto y las dos implementaciones | `src/rounds/localRounds.js`, `apiRounds.js` (token en `heardle:api:round`); textos de error en `roundErrors.js` (`fromApiError`) |
| Qué ve el browser del catálogo y los audios | `scripts/publish-assets.mjs` + `scripts/lib/publish.mjs` |
| Subida de audios y envolventes a Blob | `scripts/upload-audio.mjs` (decisión de cuándo subir `peaks.json` y qué podar en `scripts/lib/uploadAudio.mjs`, ver "Rotar el secreto") |
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
| Sacudón al errar, grano animado del fondo | `GameBoard.jsx` (`MISS_SHAKE`) · `src/index.css` (`grain`, `body::before`; se apaga con `data-tinted` en la reveal) |
| Escalera de intentos en la columna derecha (layout ancho) | `src/components/molecules/GuessHistory.jsx` (`variant="ladder"`) |
| Envolventes de onda por tema | `scripts/build-peaks.mjs` → `data/peaks.json` (publicado por clave de audio) |
| Autocomplete (teclado, ARIA, dropdown) | `src/components/molecules/GuessSearch.jsx` |
| Atajos de teclado (Tab abre el buscador, Espacio reproduce) | `src/shared/shortcuts.js` (`shortcutFor`) + el listener en `GameBoard.jsx` |
| Barra de segmentos arriba | `src/components/molecules/StageProgress.jsx` + `atoms/Segment.jsx` |
| Historial de intentos (cruz roja, "Salteado") | `src/components/molecules/GuessHistory.jsx` |
| Chips de artistas, línea de ajustes colapsable | `src/components/molecules/GameSettings.jsx` |
| Botones grandes del reveal (relleno que barre, ícono que se mueve) | `src/components/atoms/ActionButton.jsx` |
| Reveal final (disco girando, anillo, puntaje, share, jugar otra vez) | `src/components/organisms/ResultReveal.jsx`; el autoplay del tema está en `GameContainer.jsx` |
| Color del fondo del reveal según la carátula (qué tono elige, cuánto se oscurece) | `src/theme/coverTint.js` (`MAX_LUMINANCE`, `MIN_SATURATION`, `MIN_SHARE`) + `useCoverTint.js`; transición en `index.css` (`@property --color-bg`) |
| Copy y validación del formulario de mail | `src/components/organisms/EmailCapture.jsx` |
| Cuántas rondas hacen falta para que la reveal ofrezca el mail | `src/player/emailPrompt.js` (`EMAIL_AFTER_ROUNDS`, `shouldAskEmail`) |
| Conteo de rondas terminadas y de cuándo se lo cuenta una sola vez | `src/containers/GameContainer.jsx` (`heardle:roundsFinished`, `heardle:lastFinishedRound`) |
| Id anónimo del jugador (modo local) | `src/player/playerIdentity.js` |
| Suscripción de mail (API o local) | `src/leaderboard/apiAdapter.js`, `localAdapter.js`; la interfaz común está en `src/services/gameServices.js` |
| Tabla de suscriptores (Neon compartida) | `db/subscribers.sql` |
| Colores, fuentes, radio, noise | `src/theme/tokens.css` |
| Estilos base, focus ring, reduced motion, clase `.label` | `src/index.css` |
| Título, meta tags, fuentes de Google | `index.html` |
| Vercel Web Analytics | `index.html` (`/_vercel/insights/script.js`, sin dependencia npm; habilitado en el proyecto el 2026-11-11). Sin stub inline `window.va`: la CSP no permite scripts inline. Sin rutas: es una sola pantalla |
| Marco de una pantalla, header, wordmark, safe areas | `src/App.jsx` |
| Isotipo dentro del círculo (tamaño, máscara) | `src/components/molecules/PlayCircle.jsx` (`ISOTYPE_MASK`) |
| Favicon, tarjeta de compartir, meta tags | `index.html` + `public/og.png`, `public/favicon.png` |
| Íconos (check, cruz, cerrar, chevron) | `src/components/atoms/Icon.jsx` |
| Qué vista se muestra (juego / resultado) | `src/containers/GameContainer.jsx` |
| Lista de artistas y sus IDs de Spotify | `data/artists.json` |
| Cómo se arma el catálogo | `scripts/build-catalog.mjs` |
| Reintentos ante cortes de conexión (cuántos, backoff, qué se reintenta) y timeout por pedido | `src/shared/retry.js` (`withRetry`, `shouldRetry`, `withTimeout`) + `callJudge` y `REQUEST_TIMEOUT_MS` en `GameContainer.jsx` |
| Stub de localStorage para los tests | `src/test-utils/localStorage.js` |

## Flujo de datos (leer una vez)

**El servidor es el árbitro** (desde 2026-09-23, `odd/tasks/secure-rounds.md`). El browser nunca
sabe qué tema está sonando hasta que termina la ronda.

1. `GameContainer` monta, llama a `loadCatalog()` (lee `public/catalog/`, generado por
   `npm run assets`), mezcla y deduplica por ISRC. Ese catálogo sirve para el buscador y el reveal:
   **no tiene ningún dato que conecte un tema con su audio**.
2. `getGameServices()` elige el modo. Con `VITE_ROUNDS_API=true`: rondas por las Functions de
   `api/` (sin login: el estado de la ronda es un token cifrado que guarda el browser en
   `heardle:api:round`) y mails por `/api/subscribe`. Sin eso: modo local, que imita las mismas
   reglas en el browser y solo sirve para desarrollo.
3. `rounds.start(filtro, nivel)` devuelve la **vista de la ronda**: `{ id, audioKey, stages, level,
   stageIndex, attempts, status, score, answerId }`. `answerId` es `null` mientras se juega. Si hay una ronda
   abierta, devuelve esa: **nunca se reparte otra** (recargar para cambiar un tema difícil no
   sirve). Por eso cambiar los artistas o el nivel a mitad de ronda aplica desde la próxima, y lo dice (para
   el nivel, comparando `game.level` con el elegido: la vista ya lo trae).
4. Play: `useAudioPlayer(audioUrl(audioKey))` (Blob con la API, `/audio/` en local) reproduce desde 0 hasta
   `currentClipSeconds(game)`. El corte lo hacen un `setTimeout` armado en `onplaying` y el evento
   `timeupdate`; el `requestAnimationFrame` solo dibuja el anillo (ver Gotchas).
5. Guess → `rounds.guess(id, trackId, attempt)`; skip → `rounds.skip(id, attempt)`, donde
   `attempt` es cuántos intentos vio el cliente: si el servidor ya lo registró (se perdió la
   respuesta), el reintento no cuenta doble. Los cortes de conexión se reintentan solos, y un
   pedido que no contesta en 10 s cuenta como corte (`callJudge`: timeout + reintento, también
   para arrancar la ronda). Si igual falla la carga, la pantalla de error tiene un botón "Reintentar". Si el mp3
   no carga, se avisa y tocar el círculo lo reintenta. Una acción por vez (`busy`); la
   ronda solo cambia con la respuesta del árbitro. Un error se muestra arriba del buscador.
6. Al terminar, la ronda ya quedó registrada por quien la arbitró. `ResultReveal` **reemplaza** al
   `GameBoard` y busca el tema en el catálogo por `answerId`. El contenedor cuenta la ronda contra
   `heardle:roundsFinished` (una sola vez por ronda, ver "Captura de mail" abajo); a partir de la
   segunda ronda contada, y mientras `heardle:emailPrompt` siga en `pending`, la reveal ofrece dejar
   el mail (`src/player/emailPrompt.js`).

Score: si ganás, `stages.length - índice del stage ganador` (acertar de una = 4 puntos, en el
último intento = 1). Perder = 0. La definición única es `scoreFor(won, stageWon)` en el motor.

**El puntaje nunca viene del cliente** (desde 2026-09-22, `odd/tasks/fair-ranking.md`). El
browser manda solo el intento (`guess`/`skip` con el token); el árbitro avanza la ronda con el
motor y calcula el puntaje con `scoreFor` (`api/_lib/arbiter.js`), así que un cliente no puede
declarar un resultado imposible. El modo local lo deriva igual con `scoreFor`. Si cambiás `LEVELS` o
la fórmula, el motor es la única fuente: el servidor lo importa (antes había una copia en SQL,
ya no).

**El ranking se sacó del cliente y del servidor** (2026-09-28/29, `odd/tasks/remove-ranking.md`,
T1–T4). El mail solo se pedía adentro del ranking, detrás de un alias que casi nadie completaba, y
las reglas para que una ronda sumara (mínimo de partidas, 3+ artistas, primera vez por tema) eran,
en palabras del usuario, "poco claras". Se sacó `Leaderboard.jsx`, `src/leaderboard/ranking.js`, el
alias (`playerIdentity.js`) y los reads `getTop`/`getPlayerStats`/`setAlias` de los puertos; el mail
pasó a pedirse directamente en la reveal (ver el punto 6 arriba y "Captura de mail" en la tabla de
arriba). En el backend de entonces (Supabase) también se borraron `get_leaderboard`, `my_stats` y
`set_alias`; ese backend ya no existe (ver "Servidor"), y los datos de ranking que habían quedado
ahí (alias, `rounds.ranked`, `blocked_words`) se fueron con él: el nuevo servidor no guarda
rondas ni jugadores.

**Hay dos niveles de dificultad** (2026-11-04, `odd/tasks/difficulty-levels.md`). **Normal** (el
default, `[1, 2, 4, 8]`) y **Difícil** (`[0.5, 1, 3, 8]`, la escalera de antes). Motivo: la gente
entraba, perdía enseguida y se iba, porque con 0,5 s el primer intento casi siempre es un fallo. El
juego tiene que hacer que quieran jugar antes de que quieran seguir jugando.

Los tres niveles de antes (`DIFFICULTIES`, sacados el 2026-09-18) tenían tres problemas; así se
resuelven ahora:

- Tu "3/4" y el mío significaban cosas distintas, y el texto que se comparte ni decía el nivel →
  el nivel va en el reveal y en el share (`GACETA Heardle 3/4 · Difícil`).
- `score = stages.length - stageIndex` hacía que el nivel con más etapas diera más puntos → los dos
  niveles tienen **4 etapas y la última en 8 s**, así el puntaje es 4..1 / 0 en ambos y el anillo y
  el clip de 16 s no cambian (`engine.test.js` y `waveform.test.js` lo fijan).
- El ranking sumaba puntos de tres juegos en una tabla → el ranking ya no existe.
- Dos y no tres: por debajo de `[1, 2, 4, 8]` el fragmento ya empieza a regalar el tema.

El nivel es **del jugador y de la ronda**: se elige en `GameSettings` (panel ancho y línea
colapsable, `heardle:level`, default Normal), viaja en `start(artistSlugs, level)` y queda en
`rounds.level`. Una ronda abierta conserva su nivel (como su tema): cambiarlo a mitad aplica desde la
próxima. En el servidor la escalera sale del nivel que viaja dentro del token de la ronda
(`getStages(state.level)` del motor).

**Sin migración.** Con las rondas sin estado no hay filas que migrar: una ronda abierta en el
browser vive en su token, y los tokens viejos (de antes de este servidor) simplemente no abren.
En modo local, una ronda guardada sin `level` se retoma en la escalera difícil (la que se jugaba
antes de los niveles).

## Contratos de datos

**Fuentes vs. lo publicado.** `data/catalog/<slug>.json` va a git. `audio/<ISRC>.mp3` y
`data/peaks.json` (por ISRC) son fuentes **locales, fuera de git**: el repo es público y, junto a
los archivos publicados, darían todas las respuestas (el mp3 publicado es el mismo archivo; los
picos publicados son los mismos números). Se sacaron también del historial de la rama antes del
primer push (2026-09-23, `odd/tasks/review-followups.md`). Se regeneran con `npm run catalog` +
`compress-audio` + `peaks`; conviene tener un backup propio.

Lo generado por `npm run assets` (todo en `.gitignore`): `public/catalog/` siempre; con secreto,
`.published/audio/<key>.mp3` + `.published/peaks.json` para subir a Blob; sin secreto (modo
local), `public/audio/` y `public/catalog/peaks.json`. Ya no se genera ningún archivo con el
mapeo ISRC → clave: el servidor la deriva en runtime. En Vercel no hay fuentes: solo se publica el catálogo.

**Rotar el secreto** (invalida una tabla clave → respuesta armada entre jugadores; una tabla por
hash de los bytes sobrevive, es el límite aceptado): nuevo `AUDIO_KEY_SECRET` → `npm run assets` →
`npm run upload-audio` (sube los mp3 con nombres nuevos, deja los viejos) → **cambiar el secreto en
Vercel y deployar** → `npm run upload-audio -- --prune`. Las rondas abiertas siguen andando: el
token guarda el ISRC, no la clave, así que el servidor deriva la clave nueva en la próxima
respuesta. `peaks.json` tiene un solo nombre fijo en Blob y está reindexado por clave de audio;
`upload-audio` no lo vuelve a subir mientras queden claves viejas publicadas sin podar (la primera
corrida de una rotación), para no pisarlo con datos de las claves nuevas mientras el servidor
todavía reparte las viejas. Se sube recién en la corrida con `--prune`, ya con el deploy hecho.
Mientras tanto el anillo queda plano (`loadPeaks` nunca rechaza), no roto.

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

**Puertos** (`src/services/gameServices.js`): `rounds` = `start(artistSlugs, level)`, `guess(roundId, trackId, attempt)`, `skip(roundId, attempt)`, todos devuelven la vista de la ronda (`{ id, audioKey, stages, level, stageIndex, attempts, status, score, answerId, answer }`). `attempt` es `attempts.length` como lo vio el cliente: obligatorio (sin él, `invalid_attempt`), y es lo que hace seguro reintentar. En modo API la vista trae además el token sellado, que el adaptador guarda en `heardle:api:round` y reenvía; `start` también manda los ids recientes como `exclude` (ver "Servidor"). `board` = `subscribeEmail(email)`, el único método que le queda. Nadie manda puntaje ni `playerId`: no hay jugadores en el servidor.

**localStorage** (todas las claves con prefijo `heardle:`): `api:round` (el token de la ronda abierta en modo API), `artistFilter`, `level` (`normal | hard`; cualquier otro valor se lee como `normal`), `emailPrompt` (`pending | done | dismissed`), `roundsFinished` (cuántas rondas terminó este browser) y `lastFinishedRound` (el id de la última que ya se contó, para no contarla dos veces en un re-render o el doble efecto de StrictMode); `recent` (los últimos 20 temas, en los dos modos); en modo local además `playerId`, `local:round` (la ronda abierta), `local:emails`. Quien jugó antes del 2026-09-18 puede tener todavía un `heardle:difficulty` huérfano, y quien jugó antes del 2026-09-28 uno `heardle:alias`; ninguno de los dos se lee más y no molestan.

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

**Estado al 2026-09-29: los 8 artistas están completos.**

| Artista | Tracks en su JSON |
|---|---|
| Ramma | 116 |
| Valuto | 41 |
| ARA | 62 |
| Tadu Vázquez | 128 |
| Fosse | 30 |
| Barta | 22 |
| Dazen | 9 |
| Lonzo | 114 |

Eso suma 522, pero el juego tiene **454 temas**: la diferencia son colaboraciones que aparecen en
el JSON de los dos artistas y `loadCatalog` las deduplica por ISRC, dejando una sola con
`artistSlugs: [...]`. Los dos números son correctos, miden cosas distintas — el índice cuenta por
artista, el pool cuenta grabaciones.

**Alias de un artista.** Un artista de `data/artists.json` puede tener `aliases`: otros artistas de
Spotify que son la misma persona con otro nombre. Sus temas van al JSON y al chip del artista
principal (con `artists` tal como los acredita Spotify). Tadu Vázquez tiene dos, pedidos por el
usuario el 2026-09-29: **TADU** (`6kBt4i0RTsYjC5uILQ8Kr2`) y **sanantonio**
(`4MJdm7Y6VYYgTfDvywixiy`), sus proyectos solistas. Sumaron 24 temas al JSON de Tadu y 23 al juego
("LUCES EN LA NOCHE" ya estaba por Ramma). Si Deezer no encuentra un tema por ISRC, lo busca con
el nombre acreditado (el alias), no con el del artista principal.

Las cifras medidas "sobre los 431 temas" más abajo (audio, silencio inicial, peaks) son de antes
de sumar esos 23; no se volvieron a medir.

**Sin preview en Deezer: 12, todas de Tadu Vázquez** (ver `data/missing.json`): Bloque, Quererse,
Diluvio, Me Conocen, Contigo, Sangre, Watch Out, MVP, Ambición, Sombras, Whisky a las Rocas,
Tan Bien. Para sumarlas hay que conseguir el audio a mano y dejarlo en `audio/<ISRC>.mp3` y correr `npm run assets` y `npm run upload-audio`.

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

`og:image` y `twitter:image` van en URL absoluta (`https://heardle.esgaceta.com/og.png`): varios
scrapers no resuelven relativas. Si cambia el dominio, cambiarlas en `index.html`.

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
Spotify (en el verde de Spotify, `--color-spotify`, excepción a la paleta solo en ese
botón: lo pidió el usuario), y compartir como link chico abajo. Es pedido del usuario: lo que tiene que
invitar es volver a jugar y escuchar el tema. `hoverOnlyWhenSupported` está prendido en
`tailwind.config.js` para que en celular el hover no quede pegado después de un toque.

**El reveal es un disco.** Al terminar la ronda suena el tema (16 s, el clip entero) y la carátula
gira como un vinilo dentro del mismo anillo, ahora con los 16 s; lo que necesitaste para acertar
queda en acid gold. Tocar el disco lo pausa o lo vuelve a arrancar. El giro usa
`animation-play-state: paused` para que el disco se quede en su ángulo al parar en vez de volver a
cero. El autoplay depende de que el navegador cuente la página como activada (el guess fue un
click); si igual lo rechaza, el disco queda quieto esperando un toque.

**El fondo del reveal toma el color de la carátula** (pedido del usuario, 2026-09-29, con una
captura de Apple Music como referencia; la otra excepción a la paleta). `useCoverTint` (en
`src/theme/`) carga la carátula en un `Image` aparte con `crossOrigin` (i.scdn.co manda
`Access-Control-Allow-Origin: *` y la CSP ya permite ese host en `img-src`), la lee en un canvas de
32×32 y pisa `--color-bg` en `<html>` y el `theme-color`; al desmontar la reveal vuelven al
default. La lógica es pura y testeada en `coverTint.js`: `dominantColor` elige el tono con más
peso saturado (ignora negros, blancos y grises; una carátula en blanco y negro devuelve `null` y el
fondo no cambia) y `backgroundFor` lo oscurece hasta luminancia ≤ `MAX_LUMINANCE` (0,05), así el
texto blanco queda cerca de 9:1. Es un color plano, no un gradiente como en la referencia, y
**sin grano**: sobre el color se leía como un filtro sucio (lo pidió el usuario), así que
`useCoverTint` pone `data-tinted` en `<html>` y `index.css` apaga `body::before` con un fundido.
En la pantalla de juego el grano sigue. `--color-bg` está registrado con `@property` en `index.css` para que la
transición funcione. El `<img>` visible no lleva `crossOrigin` a propósito: si el CDN algún día saca
el header CORS, se pierde el tinte, no la carátula. Como el agujero del disco usa `bg-bg`, también
toma el tinte, que es lo correcto: es un agujero.

## Layout: una sola pantalla (regla dura)

**Nada scrollea, nunca, en ninguna vista.** Es un pedido explícito del usuario, no una preferencia.

- `App.jsx` es un marco de alto fijo: `h-svh` + `overflow-hidden`, con `env(safe-area-inset-*)`
  para el notch. Ese `overflow-hidden` es el contrato: si algo no entra, se recorta en silencio,
  así que **cualquier fila que agregues le saca alto al círculo**.
- Hay **dos vistas mutuamente excluyentes**, cada una dueña del marco completo: juego y resultado.
  Nunca se apilan. Las rutea `GameContainer` con `isOver`.
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
    `lg:max-w-5xl`; el resultado se queda en `max-w-md` centrado para no estirarse.

  Se decide en JS y no con `lg:hidden` **a propósito**: dos copias del historial en el DOM serían
  dos elementos con el mismo `aria-label`, y eso es peor que un re-render.
- El elemento elástico de cada vista es el que absorbe el sobrante: el círculo de play en el juego,
  la carátula en el resultado. Van con `aspect-square h-full max-h-96 w-auto max-w-full` dentro de un
  contenedor `flex-1 basis-0 min-h-0`. Todo lo demás es `shrink-0`, incluido el formulario de mail
  cuando la reveal lo muestra: si no entra, medí con la consola de abajo antes de agregarle algo más.
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
128 kbps, pero el juego escucha como máximo 8 s mientras adivinás (la última de cada nivel de `LEVELS` en
`engine.js`) y 16 s en el reveal, así que se recortan a 16 s mono 96 kbps. Medido sobre los 431 temas: **~197 MB → 81 MB (-60%)**, de 480 KB a
188 KB por tema. Eso es lo que se ahorra el que juega desde el celular en cada reproducción.

- **Los originales se guardan en `audio-raw/`**, que está en `.gitignore`. Son la fuente para
  volver a comprimir con otros parámetros sin gastar cuota de Spotify ni volver a bajar de Deezer.
- **Es idempotente.** Detecta lo ya comprimido (mono y ≤ 16,5 s) y lo saltea. Correrlo de nuevo
  después de `npm run catalog` solo toca los temas nuevos.
- Flags: `--dry`, `--force`, `--seconds=20`, `--bitrate=128k`.
- **`audio/` (las fuentes, por ISRC) NO va a git** (ver "Fuentes vs. lo publicado"). En producción
  los mp3 se sirven desde Vercel Blob, no desde el deploy. Ojo con la transferencia del plan si
  juega mucha gente: cada ronda baja hasta ~190 KB.

**Si algún día agregás una etapa de más de 16 s** en `LEVELS`, los mp3 actuales se cortan
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

## Servidor (Vercel Functions + Neon + Blob)

Desde 2026-11-11 (`odd/tasks/drop-supabase.md`) no hay Supabase: el proyecto pausado por el límite
del plan gratis se reemplazó por tres piezas que ya paga la cuenta de GACETA. No hay base de datos
de rondas.

| Pieza | Para qué | Dónde vive |
|---|---|---|
| Vercel Functions (`api/`) | Árbitro de rondas y suscripción de mails | `api/rounds/{start,guess,skip}.js`, `api/subscribe.js`, lógica en `api/_lib/` |
| Neon (compartida con Valuto) | Solo la tabla `public.subscribers` | `db/subscribers.sql` |
| Vercel Blob (store público) | mp3 con nombre opaco y `peaks.json` | `scripts/upload-audio.mjs` |

**Rondas sin estado.** `api/_lib/arbiter.js` es puro (pool, azar, reloj e ids inyectados) y usa
`src/game/engine.js` para escaleras, transiciones y puntaje: hay **una sola fuente de reglas**, la
misma que usa el modo local. El estado de la ronda `{ id, trackId, level, stageIndex, attempts,
status, createdAt }` viaja en un token opaco: `api/_lib/roundToken.js` lo sella con AES-256-GCM
(confidencial y autenticado) usando `ROUND_TOKEN_SECRET`, vence a las 24 h y todo lo que no abre
(roto, adulterado, de otra clave, vencido) es `round_not_found`. El servidor no guarda nada entre
llamadas. El pool de temas sale de los JSON de `data/catalog/` importados estáticamente
(`api/_lib/trackPool.js`, con la lista `ARTIST_FILES` cubierta por un test) y la clave de audio
se deriva en runtime con `HMAC(AUDIO_KEY_SECRET, ISRC)` (`scripts/lib/audioKey.mjs`, compartido con
`npm run assets`): **no hay archivo de mapeo ISRC → audio desplegado**, por eso ya no existe
`tracks.sql`. Sin `AUDIO_KEY_SECRET` en un entorno deployado la config tira `ConfigError` (500).

**Límites aceptados** (el usuario los aceptó el 2026-11-11):

- **Repetición del token.** Un token sin estado se puede reenviar. Un script podría reusar el token
  del stage 0 para probar todos los temas y encontrar la respuesta por eliminación. El rate limit
  del firewall lo hace lento. Si algún día importa: una tabla de "token usado" en la Neon
  compartida; el contrato con el cliente no cambia.
- **Incógnito.** Recargar en una ventana privada reparte otro tema (no hay ranking, no hay nada
  que ganar).
- **Rate limit por IP, no por jugador.** Es una regla del Vercel Firewall sobre `/api/rounds/*`
  (reemplaza el tope de 60 rondas por hora del SQL); se configura en el dashboard, no en el código.
- **Últimos 20 en el browser.** El cliente manda los últimos ids respondidos como `exclude`
  (`src/catalog/recentTracks.js`); el servidor lo respeta pero no lo guarda.

**Cliente.** `src/rounds/apiRounds.js` guarda el token de la ronda abierta en
`heardle:api:round` y `start` la retoma mientras `status === "playing"`; si el servidor responde
`round_not_found` (token vencido o clave rotada) el cliente borra el token y la próxima `start`
reparte otra. Los errores llegan como `{ error: "<código>" }` y `fromApiError` los mapea a
`roundErrors.js`; un código sin copy (`invalid_request`, `payload_too_large`, `method_not_allowed`)
cae a `unexpected`.

**Mails.** `POST /api/subscribe` (`api/_lib/subscribe.js`): verifica el token de Turnstile con
`TURNSTILE_SECRET_KEY` (timeout 5 s → `captcha_failed`), inserta en `public.subscribers` con
`on conflict do nothing` (único por `(email, source)`, `source = 'heardle'`) y **solo si la fila
es nueva** manda la bienvenida por Resend (`api/_lib/welcomeMessage.js`, remitente
`GACETA <bienvenida@esgaceta.com>`, reply-to `contacto@gacetaplay.com`, `Idempotency-Key` por hash
del mail, timeout 5 s). Si Resend falla o falta `RESEND_API_KEY`, la suscripción igual anda (solo
avisa en los logs). Sin doble opt-in, a pedido del usuario; darse de baja es responder el mail.
Para probar sin molestar a nadie, mandar a `delivered@resend.dev`. El DNS de Resend ya está cargado
en el team de Vercel.

La tabla es de **toda GACETA**, no del Heardle: se aplica a mano con
`psql "$DATABASE_URL_UNPOOLED" -f db/subscribers.sql` (idempotente, no toca `fans` de Valuto).

**Captcha (Cloudflare Turnstile).** Ahora protege la suscripción, no un login. `src/services/captcha.js`
carga `api.js?render=explicit` con un `<script>` creado en runtime (nada de dependencia npm),
renderiza el widget invisible en un contenedor de tamaño cero pegado a `document.body` (esta app no
scrollea nunca: no puede ocupar alto) y resuelve un token de un solo uso; `error-callback`,
`timeout-callback` o que el script no cargue rechazan, con un timeout total de 15 s, y el widget se
saca después de usarlo. `getCaptchaToken(siteKey)` devuelve `undefined` sin
`VITE_TURNSTILE_SITE_KEY` (dev/local anda sin captcha). Cada intento pide un token nuevo porque son
de un solo uso. El servidor lo exige una vez deployado (`TURNSTILE_SECRET_KEY`).

**Subida de audio a Blob.** `npm run upload-audio` (necesita `BLOB_READ_WRITE_TOKEN`) sube
`.published/audio/<key>.mp3` (cache de 1 día: un mp3 re-encodeado se pisa en su lugar) y
`audio/peaks.json` (cache 300 s). Saltea lo que ya está con el mismo pathname y tamaño; flags
`--dry`, `--force`, `--prune` (borra solo `.mp3` viejos, de a 100). El navegador lee de
`VITE_AUDIO_BASE_URL` (`https://<store-id>.public.blob.vercel-storage.com/audio`); un build deployado
con la API prendida y sin esa variable **falla** (`assertSafeConfig`).

**Orden de despliegue.** (1) Store de Blob, conectar Neon al proyecto y cargar variables de entorno
en Vercel; (2) aplicar `db/subscribers.sql`; (3) `npm run assets` + `npm run upload-audio`;
(4) deploy con `VITE_ROUNDS_API=true`; (5) regla del firewall sobre `/api/rounds/*`; (6) smoke de
una ronda completa y una suscripción. Todo eso es el T6 de `odd/tasks/drop-supabase.md` y necesita
el OK explícito del usuario (toca producción). El deploy sigue siendo por CLI desde `heardle-gaceta/`
(ver "Deploy" en el Backlog).

**Desarrollo local.** `npm run dev` (Vite solo) corre en **modo local**: las rondas se reparten y
juzgan en el browser (`localRounds.js`), sin `api/`. Para probar las Functions de verdad hay que
levantarlas con `vercel dev` (el CLI detecta Vite y sirve `api/` sin configuración extra, según la
documentación de Vercel; no lo corrí desde esta máquina), con `VITE_ROUNDS_API=true` y
`ROUND_TOKEN_SECRET` / `AUDIO_KEY_SECRET` en `.env`. Los tests de `api/` no necesitan nada de eso:
inyectan `sql`, `fetch` y el reloj.

Límite aceptado: alguien que juegue los 431 temas puede reconocer cada mp3 por sus bytes y armarse
una tabla. No se puede frenar con código.

## Cómo verificar un cambio

1. `npm run test` — tiene que dar **301/301** en 33 archivos (o más si agregás tests). El `include` de vitest cubre `src/**/*.test.js`, `scripts/**/*.test.mjs` y `api/**/*.test.js`, así que el tooling de build y el servidor (árbitro, token, suscripción, bienvenida) se testean donde viven, con `sql`, `fetch` y el reloj inyectados.
2. `npm run build` — tiene que compilar. Si `prebuild` (`npm run assets`) se cuelga: el Desktop se sincroniza con iCloud y los mp3 de `audio/` pueden quedar "dataless" (solo en la nube); leerlos bloquea hasta bajarlos. Bajá la carpeta (Finder → "Descargar ahora") o mantenela fuera de iCloud; mientras tanto `npx vite build` compila sin correr `assets`. También hay duplicados `* 2.mp3` que crea iCloud.
   Lint: el `eslint.config.js` de la raíz **ignora `heardle-gaceta/`**, así que un `eslint` común
   no revisa nada acá. Desde la raíz: `npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts heardle-gaceta/api`.
   Ojo que `no-unused-vars` deja pasar nombres en mayúsculas (`^[A-Z_]`).
   Servidor: no hay smoke automático; la verificación contra producción es el T6 de `odd/tasks/drop-supabase.md`. Tras compilar, `rg -i supabase dist` tiene que dar vacío.
3. Probar a mano en `npm run dev`: cargar, play, un guess incorrecto, un skip, llegar al reveal, share. Para ver el mail sin jugar dos rondas: subí `heardle:roundsFinished` a mano en localStorage a 2 o más y recargá el reveal.

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
en `https://heardle.esgaceta.com` (subdominio agregado al proyecto el 2026-11-04; `esgaceta.com` y su
DNS están en el mismo team, así que no hubo que cargar registros; `heardle-gaceta.vercel.app` sigue
andando). El link "Jugá otra ronda" del mail de bienvenida apunta al subdominio. Se deploya por CLI desde `heardle-gaceta/`
(`vercel deploy --prod --scope gaceta-97ec2001`); `.vercelignore` deja afuera `.env` y todo lo que
conecta un tema con su audio. Sus rutas van ancladas con `/`: un `audio` suelto también excluía
`src/audio/` y rompió el primer build. Las variables que hay que cargar en
production y preview están en la tabla de "Comandos"; al 2026-11-11 el proyecto de Vercel todavía
tiene las de Supabase y le faltan las nuevas (T6).

**Lo que sigue abierto, porque depende de vos:** el rollout del servidor nuevo (T6 de
`odd/tasks/drop-supabase.md`: store de Blob, Neon conectada, variables, regla del firewall, subir
el audio, deploy y smoke) y completar los 12 temas sin preview.

Encontrado y arreglado de paso: entre que cargaba el catálogo y arrancaba la ronda se veía un
instante **"No hay temas para esa selección"** aunque había 209. Ese mensaje ahora solo aparece
cuando `poolSize === 0` de verdad; si no, va un spinner.

## Review nativo (Gentle AI, receipt-driven development)

Está activado globalmente. Después de un cambio, el flujo es: `gentle-ai review status --cwd <raíz del repo Gaceta-web> --contract gentle-ai.review-integration/v2 --agent claude-code --next-transition` y seguir el `next_transition` que devuelve. Cosas que ya pasaron y conviene saber:

- La raíz del repo git es `Gaceta-web/`, no `heardle-gaceta/`. Todo el subproyecto está sin trackear, así que el review pide una **selección de archivos untracked**: pasar `--untracked-scope select --expected-untracked-inventory <digest del status> --intended-untracked=<ruta> …`. Excluir `audio/` y `data/peaks.json` (no van a git: ver "Fuentes vs. lo publicado"), `.published/`, `audio-raw/`, `.env`, `data/cache/`, `data/missing.json`, `package-lock.json` y el brief.
- Si un fix agrega un archivo nuevo que no estaba en la selección congelada, el review responde `corrected_candidate_unavailable`. Se resuelve con `gentle-ai review recover --disposition scope_changed` (pide autorización del usuario) y una lineage sucesora.
- El primer `status` con selección a veces da `operation_timeout` transitorio. Reportado en gentle-ai#1833. Un reintento idéntico suele andar.
