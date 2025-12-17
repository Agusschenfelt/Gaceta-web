import { useEffect, useRef, useState } from "react";
import { SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    const check = () => setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Control de Play/Pause y cambio de track
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Si cambia el índice y estaba sonando, o si le dimos play
    if (isPlaying) {
      // Pequeño timeout para asegurar que el src cargó si cambió el track
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Auto-play policy a veces bloquea, manejamos el error silenciosamente
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

  // 3. ANTERIOR ALEATORIO (Opcional: en modo shuffle, "atrás" también suele ser random 
  // si no guardamos historial. Para mantener el vibe de descubrimiento, lo dejamos random).
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

  const handleEnded = () => handleNext(); // Auto-next aleatorio al terminar tema

  // Formato de tiempo (mm:ss)
  const fmt = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  if (!isDesktop) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        volume={volume} 
      />

      {/* ---- MINI PLAYER (Flotante) ---- */}
      <AnimatePresence>
        {!menuOpen && (
          <motion.div
            key="compact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 right-6 z-[90]
                       w-[280px] rounded-full bg-[#0a0a0a] 
                       border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] 
                       overflow-hidden group hover:border-[#dee5a0]/40 transition-colors duration-500"
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
                 <button onClick={handlePrev} className="p-2 text-white/50 hover:text-white transition-colors"><SkipBack size={14}/></button>
                 <button onClick={togglePlay} className="p-2 text-white hover:text-[#dee5a0] transition-colors">
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                 </button>
                 <button onClick={handleNext} className="p-2 text-white/50 hover:text-white transition-colors"><SkipForward size={14}/></button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- MAXI PLAYER (Expandido) ---- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.aside
            key="expanded"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="
              fixed z-[110] bottom-6 right-6
              w-[min(90vw,340px)] 
              bg-[#0a0a0a] border border-white/10
              rounded-xl shadow-2xl overflow-hidden
            "
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}