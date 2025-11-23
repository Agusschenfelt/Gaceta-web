// MusicPlayer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "./MenuStore";

export default function MusicPlayer() {
  const { open: menuOpen } = useMenu();

  // 👉 Solo desktop (min-width: 768px)
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(min-width: 768px)");

    const handleChange = (e) => {
      setIsDesktop(e.matches);
    };

    setIsDesktop(mql.matches);
    mql.addEventListener("change", handleChange);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  // Si no es desktop, el reproductor NO existe
  if (!isDesktop) return null;

  const tracks = [
    {
      id: "t1",
      title: "Delirio",
      artist: "Ramma",
      src: "...s/Trip/delirio_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
    {
      id: "t2",
      title: "Lejos",
      artist: "Royalty Free",
      src: "...s/Trip/lejos_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
    {
      id: "t3",
      title: "Viernes",
      artist: "Royalty Free",
      src: "...s/Trip/viernes_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
    {
      id: "t4",
      title: "Delirio",
      artist: "Ramma",
      src: "...s/Trip/delirio_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
    {
      id: "t5",
      title: "Lejos",
      artist: "Royalty Free",
      src: "...s/Trip/lejos_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
    {
      id: "t6",
      title: "Viernes",
      artist: "Royalty Free",
      src: "...s/Trip/viernes_audio.mp3",
      cover: "/assets/constelacion.jpeg",
    },
  ];

  const audioRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [durMap, setDurMap] = useState({});

  const userInteractedRef = useRef(false);
  const switchingRef = useRef(false);
  const pendingAutoplayRef = useRef(false);

  const currentTrack = tracks[index];

  useEffect(() => {
    let cancel = false;
    (async () => {
      const entries = await Promise.all(
        tracks.map(
          (t) =>
            new Promise((resolve) => {
              const a = new Audio();
              a.src = t.src;
              a.preload = "metadata";
              a.addEventListener(
                "loadedmetadata",
                () => {
                  resolve([t.id, Number.isFinite(a.duration) ? a.duration : 0]);
                },
                { once: true }
              );
              a.addEventListener("error", () => resolve([t.id, 0]), {
                once: true,
              });
            })
        )
      );
      if (!cancel) setDurMap(Object.fromEntries(entries));
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const mark = () => {
      userInteractedRef.current = true;
    };
    window.addEventListener("pointerdown", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    window.addEventListener("touchstart", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("touchstart", mark);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    switchingRef.current = true;
    pendingAutoplayRef.current = userInteractedRef.current;

    a.pause();
    a.src = currentTrack.src;
    a.load();
    setCurrent(0);
    setDuration(0);
  }, [index, currentTrack.src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (switchingRef.current) return;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const handleNext = () => setIndex((i) => (i + 1) % tracks.length);
  const handlePrev = () =>
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  const handleSeek = (v) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setCurrent(v);
  };

  const fmt = (s) => {
    const secs = Number.isFinite(s) ? Math.max(0, s) : 0;
    const m = Math.floor(secs / 60);
    const ss = Math.floor(secs % 60);
    return `${m}:${String(ss).padStart(2, "0")}`;
  };

  const queue = useMemo(
    () => tracks.filter((_, i) => i !== index),
    [tracks, index]
  );

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          const d = a.duration;
          setDuration(Number.isFinite(d) ? d : 0);

          if (pendingAutoplayRef.current) {
            a.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            a.pause();
            setIsPlaying(false);
          }

          pendingAutoplayRef.current = false;
          switchingRef.current = false;
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrent(Number.isFinite(t) ? t : 0);
        }}
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* ---- Card compacta (menú cerrado) ---- */}
      <AnimatePresence initial={false}>
        {!menuOpen && (
          <motion.div
            key="compact"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50
                       w-[300px] rounded-2xl bg-zinc-900/30 backdrop-blur-sm
                       border border-zinc-800/60 shadow-xl overflow-hidden text-white"
          >
            <div className="relative min-h-[64px]">
              <div className="flex items-center gap-3 px-3 py-3 pr-[116px]">
                <div className="size-10 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 leading-tight">
                  <h3 className="text-white text-sm font-medium truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-zinc-400 text-xs truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              <div
                className="absolute right-3 top-1/2 -translate-y-1/2
                              w-[116px] flex items-center justify-between"
              >
                <button
                  onClick={handlePrev}
                  aria-label="Anterior"
                  className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition"
                >
                  <SkipBack className="block w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                  className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition"
                >
                  {isPlaying ? (
                    <Pause className="block w-4 h-4" />
                  ) : (
                    <Play className="block w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  aria-label="Siguiente"
                  className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition"
                >
                  <SkipForward className="block w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Panel expandido (menú abierto) ---- */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.aside
            key="expanded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="
              fixed z-[60]
              bottom-3 right-3
              w-[min(65vw,260px)] max-h[85vh]
              md:bottom-6 md:right-6 md:w-[min(85vw,320px)]
              rounded-[28px] bg-zinc-900/50 border border-white/10
              backdrop-blur-2xl shadow-2xl overflow-hidden text-white
              flex flex-col
            "
          >
            <div className="p-5">
              <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-white/10">
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-semibold truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-sm text-white/70 truncate">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, duration)}
                  step={0.1}
                  value={current}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-white"
                />
                <div className="mt-1 flex justify-between text-xs text-white/60">
                  <span>{fmt(current)}</span>
                  <span>-{fmt(Math.max(0, duration - current))}</span>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="volume" className="sr-only">
                  Volumen
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={volume === 0 ? "Activar volumen" : "Silenciar"}
                    onClick={() => setVolume((v) => (v === 0 ? 0.9 : 0))}
                    className="p-2 rounded-full hover:bg-white/10 transition grid place-items-center w-9 h-9"
                  >
                    <VolumeIcon v={volume} />
                  </button>

                  <input
                    id="volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 accent-white"
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-valuenow={Number(volume.toFixed(2))}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-6">
                <IconButton label="Prev" onClick={handlePrev}>
                  <SkipBack className="w-6 h-6" />
                </IconButton>
                <IconButton
                  label={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                  big
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7" />
                  ) : (
                    <Play className="w-7 h-7" />
                  )}
                </IconButton>
                <IconButton label="Next" onClick={handleNext}>
                  <SkipForward className="w-6 h-6" />
                </IconButton>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({ label, onClick, big, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-2 rounded-full hover:bg-white/10 transition grid place-items-center ${
        big ? "w-11 h-11" : "w-9 h-9"
      }`}
    >
      {children}
    </button>
  );
}

function VolumeIcon({ v }) {
  if (v === 0) return <VolumeX className="w-5 h-5" />;
  if (v < 0.34) return <Volume className="w-5 h-5" />;
  if (v < 0.67) return <Volume1 className="w-5 h-5" />;
  return <Volume2 className="w-5 h-5" />;
}
