import { useEffect, useRef, useState } from "react";
import { SkipBack, Play, Pause, SkipForward, Shuffle } from "lucide-react";
import { useMenu } from "./MenuStore";
import { TRACKS_DATA } from "../../data/tracks";

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

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (val) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleEnded = () => handleNext();

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
        className={`fixed bottom-6 right-6 z-[90]
                   w-[280px] rounded-full bg-[#0a0a0a]
                   border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]
                   overflow-hidden group hover:border-[#dee5a0]/40
                   transition-all duration-400
                   ${!menuOpen
                     ? 'opacity-100 translate-y-0 pointer-events-auto'
                     : 'opacity-0 translate-y-5 pointer-events-none'
                   }`}
      >
        {/* Barra de progreso inferior */}
        <div
            className="absolute bottom-0 left-0 h-[2px] bg-[#dee5a0] transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        <div className="relative flex items-center justify-between p-2 pl-3 h-14">

          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-9 h-9 rounded-full border border-white/10 overflow-hidden shrink-0 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
               <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover opacity-90" />
            </div>

            <div className="flex flex-col min-w-0 pr-2">
               <span className="font-serif text-white text-base leading-none truncate">
                  {currentTrack.title}
               </span>
               <span className="font-mono text-[9px] uppercase tracking-widest text-[#dee5a0] truncate">
                  {currentTrack.artist}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-1 pr-2">
             <Shuffle size={10} className="text-[#dee5a0]/60 mr-0.5 shrink-0" title="Shuffle activo" />
             <button onClick={handlePrev} className="p-2 text-white/50 hover:text-white transition-colors"><SkipBack size={14}/></button>
             <button onClick={togglePlay} className="p-2 text-white hover:text-[#dee5a0] transition-colors">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
             </button>
             <button onClick={handleNext} className="p-2 text-white/50 hover:text-white transition-colors"><SkipForward size={14}/></button>
          </div>

        </div>
      </div>

      {/* ---- MAXI PLAYER (Expandido) ---- */}
      <aside
        className={`
          fixed z-[110] bottom-6 right-6
          w-[min(90vw,340px)]
          bg-[#0a0a0a] border border-white/10
          rounded-xl shadow-2xl overflow-hidden
          transition-all duration-400
          ${menuOpen
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 translate-x-12 pointer-events-none'
          }
        `}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-noise" />

        <div className="relative p-6 flex flex-col gap-6">

           <div className="w-full aspect-square rounded-lg border border-white/5 overflow-hidden relative group shadow-2xl">
              <img src={currentTrack.cover} alt="Cover Grande" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none" />
           </div>

           <div className="text-center">
              <h3 className="text-2xl font-serif italic text-white mb-1 truncate">{currentTrack.title}</h3>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#dee5a0]">{currentTrack.artist}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Shuffle size={10} className="text-[#dee5a0]/50" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">Shuffle</span>
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
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer rounded-full
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:bg-[#dee5a0] [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
              />
           </div>

           <div className="flex items-center justify-between px-4 pb-2">
              <button onClick={handlePrev} className="text-white/40 hover:text-white transition-colors hover:scale-110"><SkipBack size={28} /></button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#dee5a0] hover:text-[#dee5a0] hover:scale-105 transition-all duration-300 bg-white/5"
              >
                 {isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={handleNext} className="text-white/40 hover:text-white transition-colors hover:scale-110"><SkipForward size={28} /></button>
           </div>

        </div>
      </aside>

      </>)}

      {/* ---- MOBILE PLAYER ---- */}
      {!isDesktop && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-[90] bg-[#0a0a0a] border-t border-white/10
                      transition-all duration-300
                      ${!menuOpen
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-20 opacity-0 pointer-events-none'
                      }`}
        >
          {/* Barra de progreso */}
          <div
            className="h-[2px] bg-[#dee5a0] transition-all duration-100 ease-linear"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <div className="flex items-center justify-between px-4 h-16">
            {/* Info del track */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 shrink-0 overflow-hidden rounded-sm border border-white/10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-serif truncate leading-none mb-0.5">{currentTrack.title}</p>
                <p className="text-[#dee5a0] text-[9px] font-mono uppercase tracking-widest truncate">{currentTrack.artist}</p>
              </div>
            </div>
            {/* Controles */}
            <div className="flex items-center gap-1 shrink-0">
              <Shuffle size={10} className="text-[#dee5a0]/50 mr-1 shrink-0" title="Shuffle activo" />
              <button onClick={handlePrev} className="p-2 text-white/40 hover:text-white transition-colors"><SkipBack size={16} /></button>
              <button onClick={togglePlay} className="p-3 text-white">
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
              <button onClick={handleNext} className="p-2 text-white/40 hover:text-white transition-colors"><SkipForward size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
