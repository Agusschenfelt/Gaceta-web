# Brief — Juego "adiviná el tema"

## Qué es

Juego tipo Heardle con el catálogo de los artistas de un sello. Referencia exacta — https://quizly.gg/songly, replicar esa mecánica literal, adaptada al catálogo propio.

Tiene que ser simple, liviano, una sola pantalla — algo que alguien abre desde la cama, juega un rato, se divierte, y listo. Nada de fricción, nada de complejidad innecesaria.

Vive en su propio subdominio, con estética propia (a definir por separado). Después se muestra en mi portfolio con un link/redirect a ese subdominio.

Escala esperada — realista, entre amigos y su círculo, capaz 50 personas jugándolo activamente. No hace falta diseñar para volumen grande.

## Mecánica (calcada de Songly)

- Pantalla única. Círculo central grande que reproduce el fragmento del tema al tocarlo.
- Al lado del círculo, contador que muestra cuánto dura el fragmento actual.
- Barra de progreso arriba con 6 segmentos, marca en qué intento va el jugador.
- 6 "stages" de duración fijos, configurables — sugerido igual a la referencia — 0.1s / 0.5s / 2s / 3s / 8s / 15s. Cada intento fallido pasa al siguiente stage y el fragmento se hace más largo.
- Buscador con autocomplete debajo del círculo — el jugador escribe y aparecen sugerencias (nombre del tema + artista), elige una como su intento.
- Botón "Skip" — funciona como "me rindo este intento", pasa directo al siguiente stage sin gastar el intento en un guess incorrecto.
- Cada intento fallido queda listado debajo, con el nombre del tema que se intentó y una marca de incorrecto (cruz roja) — se ve el historial de intentos de la ronda actual.
- Niveles de dificultad simples (ej. Easy/Medium/Hard) que ajustan cuántos stages están disponibles — en el más fácil, los 6 escalones completos; en los más difíciles, se salta directamente a fragmentos más cortos, con menos margen.
- Al acertar o agotar los 6 intentos, se revela el tema (nombre, artista, carátula, link a Spotify si existe) y aparece la opción de compartir el resultado (texto tipo Wordle, con el patrón de aciertos/fallos en emoji).

## Selección de artista

- Catálogo mezclado por default — los temas que salen al azar pueden ser de cualquier artista, sin elegir nada para arrancar a jugar.
- Filtro opcional — el usuario puede elegir uno o varios artistas para acotar el pool de temas, pero no es obligatorio.

## Decisión técnica clave — audio

La API pública de Spotify deprecó el campo `preview_url` desde fines de 2024 — hoy devuelve null para la gran mayoría de los tracks, así que no se puede usar como fuente.

La alternativa es la API pública de Deezer, que todavía sirve previews de 30 segundos de forma oficial y sin necesitar login ni token

- `GET https://api.deezer.com/search?q=<tema> <artista>` devuelve, entre otros datos, un campo `preview` con la URL directa a un mp3 de 30 segundos — alcanza de sobra para los cortes de 15-20s que necesita el juego.
- Como es probable que Gaceta distribuya a las plataformas grandes a la vez (vía DistroKid o similar), es esperable que la mayoría del catálogo también esté en Deezer, no solo en Spotify.
- Para los temas que no aparezcan en Deezer (catálogo chico, lanzamientos muy autogestionados), como plan B puntual — bajar el audio de YouTube con una herramienta tipo yt-dlp y recortar el fragmento a mano. Solo para excepciones, no como fuente principal.
- El proceso de armado de catálogo — por cada tema, buscar en Deezer, guardar la preview_url (o descargarla y guardar el archivo propio para no depender de que Deezer la mantenga viva), y completar el JSON de datos.

## Leaderboard — simple, pensado para captar mails

Nada de sistemas de percentil ni cálculos de dificultad por tema — un ranking simple y directo.

- Score por partida = en qué stage acertó (antes = mejor) o directo la cantidad de intentos usados.
- Leaderboard global con puntaje acumulado (suma o promedio de las partidas jugadas por jugador).
- ID anónimo en localStorage para identificar al jugador entre partidas, sin login. Si cambia de dispositivo pierde el historial — no vale la pena resolver eso para esta escala.
- Para aparecer en el leaderboard con nombre, se pide un alias simple (no mail).
- El mail se pide aparte, después de jugar, como opción — algo tipo "dejá tu mail para enterarte de novedades" — nunca obligatorio para jugar ni para salir en el leaderboard. Esta es la función principal del leaderboard — dar una razón para volver y en ese momento ofrecer sumarse a la lista.

## Estética

Tiene que reflejar identidad visual propia (a pasar por separado — colores, tipografía, logo). Dejar la estructura de componentes lista para theming fácil.

## Estructura de datos

Por artista, un JSON con la lista de temas

```json
{
  "artist": "nombre",
  "tracks": [
    {
      "title": "nombre del tema",
      "audio_file": "ruta o url al corte (al menos 15s)",
      "cover_url": "carátula",
      "spotify_url": "link al tema real (opcional, para el resultado final)"
    }
  ]
}
```

## Stack sugerido

- Frontend simple (Next.js o Vite).
- Los archivos de audio se sirven como assets estáticos del proyecto.
- Para el leaderboard y los mails, algo mínimo — Supabase o Firebase resuelve persistencia sin mantener backend propio. Nada de infraestructura pesada para esta escala.
- Deploy en subdominio propio, sin necesidad de tocar mi VPS (todo esto entra cómodo en Vercel/Netlify + Supabase/Firebase).

## Qué necesito que armes

1. Estructura del proyecto (frontend, componentes del juego, sistema de theming para aplicar identidad visual después).
2. Lógica del juego completa — los 6 stages, botón skip, historial de intentos, autocomplete, revelado final, share de resultado.
3. Catálogo mezclado + filtro opcional de artista.
4. Leaderboard simple (score por stage/intentos, ID anónimo + alias, sin sistemas de percentil).
5. Flujo de captura de mail post-resultado, opcional y no bloqueante.
6. Script o herramienta chica para armar el catálogo — buscar cada tema en la API de Deezer, guardar la preview_url o descargarla como archivo propio, y generar/completar el JSON de datos por artista.
7. Responsive, mobile-first.

## Dónde freno yo

- Pasar los assets de marca (colores, logo, tipografía) para aplicar el theming.
- Definir el dominio/subdominio final y hacer el deploy.
- Configurar Supabase/Firebase (o lo que se use para persistencia).
- Completar manualmente los temas que no aparezcan en Deezer (bajar de YouTube como excepción).
