import { useEffect, useRef, useState, useCallback } from "react";
import { SkipBack, Play, Pause, SkipForward, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { useMenu } from "./MenuStore";
import { TRACKS_DATA } from "../../data/tracks";

// Barras animadas "now playing"
function PlayingBars() {
  return (
    <span className="flex items-end gap-[2px] h-[10px] shrink-0" aria-hidden="true">
      <span className="w-[2px] bg-secundario rounded-sm origin-bottom" style={{ animation: "playingBar 0.8s ease-in-out infinite" }} />
      <span className="w-[2px] bg-secundario rounded-sm origin-bottom" style={{ animation: "playingBar 0.8s ease-in-out 0.2s infinite" }} />
      <span className="w-[2px] bg-secundario rounded-sm origin-bottom" style={{ animation: "playingBar 0.8s ease-in-out 0.4s infinite" }} />
    </span>
  );
}

// Slug de artista si es único (no colaboración)
const getSingleArtistSlug = (artist) => {
  if (!artist || artist.includes(",") || artist.includes("&")) return null;
  return artist.toLowerCase().replace(/\s+/g, "-");
};

// HELPER: Genera un índice aleatorio distinto al actual
const getRandomTrackIndex = (currentIndex, totalTracks) => {
  if (totalTracks <= 1) return 0;
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * totalTracks);
  } while (newIndex === currentIndex);
  return newIndex;
};

export default function MusicPlayer() {
  const { open: menuOpen } = useMenu();
  const [isDesktop, setIsDesktop] = useState(false);

  const tracks = TRACKS_DATA;

  // Estados del reproductor
  const audioRef = useRef(null);

  // 1. INICIO ALEATORIO: Inicializamos el estado con un número random
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * TRACKS_DATA.length));

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const currentTrack = tracks[trackIndex];

  // Solo mostrar en desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Control de Play/Pause y cambio de track
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
            setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, trackIndex]);

  // Manejadores
  const togglePlay = () => setIsPlaying(!isPlaying);

  // 2. SIGUIENTE ALEATORIO
  const handleNext = () => {
    setTrackIndex((prev) => getRandomTrackIndex(prev, tracks.length));
    setIsPlaying(true);
  };

  // 3. ANTERIOR ALEATORIO
  const handlePrev = () => {
    setTrackIndex((prev) => getRandomTrackIndex(prev, tracks.length));
    setIsPlaying(true);
  };

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const handleSeek = useCallback((val) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  }, []);

  const handleEnded = useCallback(() => handleNext(), []);

  // Volumen aplicado por ref — el atributo HTML volume={} no funciona
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Formato de tiempo (mm:ss)
  const fmt = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* ---- DESKTOP PLAYERS ---- */}
      {isDesktop && (<>

      {/* ---- MINI PLAYER (Flotante) ---- */}
      <div
        role="region"
        aria-label="Reproductor de música"
        className={`fixed bottom-6 right-6 z-[90]
                   w-[280px] rounded-full bg-fondo
                   border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]
                   overflow-hidden group hover:border-secundario/40
                   transition-[opacity,transform] duration-[400ms]
                   ${!menuOpen
                     ? 'opacity-100 translate-y-0 pointer-events-auto'
                     : 'opacity-0 translate-y-5 pointer-events-none'
                   }`}
      >
        {/* Barra de progreso inferior */}
        <div
            className="absolute bottom-0 left-0 h-[2px] w-full bg-secundario origin-left"
            style={{ transform: `scaleX(${duration ? currentTime / duration : 0})` }}
        />

        <div className="relative flex items-center justify-between p-2 pl-3 h-14">

          <div className="flex items-center gap-3 overflow-hidden">
            {/* Cover con fade-in al cambiar de track */}
            <div className={`w-9 h-9 rounded-full border border-white/10 overflow-hidden shrink-0 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
               <img key={trackIndex} src={currentTrack.cover} alt="" className="w-full h-full object-cover" style={{ animation: "fadeInCover 0.4s ease-out forwards" }} />
            </div>

            <div key={trackIndex} className="flex flex-col min-w-0 pr-2" style={{ animation: "trackIn 0.3s ease-out" }}>
               {/* Marquee para títulos largos */}
               {currentTrack.title.length > 20 ? (
                 <div className="overflow-hidden">
                   <span className="font-serif text-white text-base leading-none whitespace-nowrap inline-block" style={{ animation: "marqueeText 10s linear 1s infinite" }}>
                     {currentTrack.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{currentTrack.title}
                   </span>
                 </div>
               ) : (
                 <span className="font-serif text-white text-base leading-none truncate">
                   {currentTrack.title}
                 </span>
               )}
               {/* Artista como link si es artista único */}
               {getSingleArtistSlug(currentTrack.artist) ? (
                 <Link to={`/artistas/${getSingleArtistSlug(currentTrack.artist)}`} className="font-mono text-[11px] uppercase tracking-widest text-secundario truncate hover:opacity-70 transition-opacity">
                   {currentTrack.artist}
                 </Link>
               ) : (
                 <span className="font-mono text-[11px] uppercase tracking-widest text-secundario truncate">
                   {currentTrack.artist}
                 </span>
               )}
            </div>
          </div>

          <div className="flex items-center gap-1 pr-2">
             {isPlaying ? <PlayingBars /> : <Shuffle size={10} className="text-secundario/40 mr-0.5 shrink-0" aria-hidden="true" />}
             <button onClick={handlePrev} aria-label="Pista anterior" className="p-3 text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipBack size={14}/></button>
             <button onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproducir"} className="p-3 text-white hover:text-secundario transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
             </button>
             <button onClick={handleNext} aria-label="Siguiente pista" className="p-3 text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipForward size={14}/></button>
          </div>

        </div>
      </div>

      {/* ---- MAXI PLAYER (Expandido) ---- */}
      <aside
        aria-label="Reproductor de música"
        className={`
          fixed z-[110] bottom-6 right-6
          w-[min(90vw,340px)]
          bg-fondo border border-white/10
          rounded-xl shadow-2xl overflow-hidden
          transition-[opacity,transform] duration-[400ms]
          ${menuOpen
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 translate-x-12 pointer-events-none'
          }
        `}
      >
        <div className="noise-texture absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" />

        <div className="relative p-6 flex flex-col gap-6">

           <div className="w-full aspect-square rounded-lg border border-white/5 overflow-hidden relative group shadow-2xl">
              <img src={currentTrack.cover} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none" />
           </div>

           <div key={trackIndex} className="text-center" style={{ animation: "trackIn 0.35s ease-out" }}>
              <h3 className="text-2xl font-serif italic text-white mb-1 truncate">{currentTrack.title}</h3>
              {getSingleArtistSlug(currentTrack.artist) ? (
                <Link to={`/artistas/${getSingleArtistSlug(currentTrack.artist)}`} className="text-xs font-mono uppercase tracking-[0.2em] text-secundario hover:opacity-70 transition-opacity">
                  {currentTrack.artist}
                </Link>
              ) : (
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-secundario">{currentTrack.artist}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                {isPlaying ? (
                  <PlayingBars />
                ) : (
                  <>
                    <Shuffle size={10} className="text-secundario/40" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">Shuffle</span>
                  </>
                )}
              </div>
           </div>

           <div className="w-full">
              <div className="flex justify-between text-[10px] font-mono text-white/30 mb-2">
                 <span>{fmt(currentTime)}</span>
                 <span>{fmt(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                aria-label="Posición de reproducción"
                aria-valuetext={`${fmt(currentTime)} de ${fmt(duration)}`}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer rounded-full
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:bg-secundario [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
              />
           </div>

           <div className="flex items-center justify-between px-4 pb-2">
              <button onClick={handlePrev} aria-label="Pista anterior" className="p-3 text-white/40 hover:text-white transition-colors hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipBack size={28} /></button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
                className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-secundario hover:text-secundario hover:scale-105 transition-[border-color,color,transform] duration-300 bg-white/5"
              >
                 {isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={handleNext} aria-label="Siguiente pista" className="p-3 text-white/40 hover:text-white transition-colors hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipForward size={28} /></button>
           </div>

        </div>
      </aside>

      </>)}

      {/* ---- MOBILE PLAYER ---- */}
      {!isDesktop && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-[90] bg-fondo border-t border-white/10
                      transition-[opacity,transform] duration-300
                      ${!menuOpen
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-20 opacity-0 pointer-events-none'
                      }`}
        >
          {/* Barra de progreso */}
          <div
            className="h-[2px] w-full bg-secundario origin-left"
            style={{ transform: `scaleX(${duration ? currentTime / duration : 0})` }}
          />
          <div className="flex items-center justify-between px-4 h-16">
            {/* Info del track */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 shrink-0 overflow-hidden rounded-sm border border-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                <img key={trackIndex} src={currentTrack.cover} alt="" className="w-full h-full object-cover" style={{ animation: "fadeInCover 0.4s ease-out forwards" }} />
              </div>
              <div key={trackIndex} className="min-w-0" style={{ animation: "trackIn 0.3s ease-out" }}>
                <p className="text-white text-sm font-serif truncate leading-none mb-0.5">{currentTrack.title}</p>
                {getSingleArtistSlug(currentTrack.artist) ? (
                  <Link to={`/artistas/${getSingleArtistSlug(currentTrack.artist)}`} className="text-secundario text-[11px] font-mono uppercase tracking-widest truncate block hover:opacity-70 transition-opacity">
                    {currentTrack.artist}
                  </Link>
                ) : (
                  <p className="text-secundario text-[11px] font-mono uppercase tracking-widest truncate">{currentTrack.artist}</p>
                )}
              </div>
            </div>
            {/* Controles */}
            <div className="flex items-center gap-1 shrink-0">
              {isPlaying ? <PlayingBars /> : <Shuffle size={10} className="text-secundario/40 mr-1 shrink-0" aria-hidden="true" />}
              <button onClick={handlePrev} aria-label="Pista anterior" className="p-3 text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipBack size={16} /></button>
              <button onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproducir"} className="p-3 text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
              <button onClick={handleNext} aria-label="Siguiente pista" className="p-3 text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><SkipForward size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
