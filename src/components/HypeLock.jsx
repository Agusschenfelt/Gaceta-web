import { Lock, Unlock, ArrowRight } from "lucide-react";
import { FaInstagram, FaTwitter } from "react-icons/fa"; 
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, useState, useLayoutEffect } from "react";

// --- CONFIGURACIÓN ---
const IS_LOCKED_INITIALLY = true; 
const ACCESS_PASSWORD = "GACETAZO"; 

export default function HypeLock() {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  
  const [isLocked, setIsLocked] = useState(IS_LOCKED_INITIALLY);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. CONTROL DE SCROLL REFORZADO (Bloquea HTML y BODY)
  useLayoutEffect(() => {
    if (isLocked) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      // USAMOS 100dvh PARA MÓVILES (Dynamic Viewport Height)
      document.body.style.height = "100dvh";               
      document.body.style.touchAction = "none";           
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
    };
  }, [isLocked]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password.toUpperCase() === ACCESS_PASSWORD) {
        setSuccess(true);
        setError(false);
        // Quitamos el foco del input inmediatamente para evitar teclados molestos
        if(inputRef.current) inputRef.current.blur();
        
        const tl = gsap.timeline({
            onComplete: () => setIsLocked(false)
        });

        tl.to(formRef.current, { scale: 1.1, opacity: 0, duration: 0.3, ease: "power2.in" })
          .to(containerRef.current, { opacity: 0, backdropFilter: "blur(0px)", duration: 0.8 }, "-=0.1");

    } else {
        setError(true);
        gsap.fromTo(formRef.current, 
            { x: -10 }, 
            { x: 10, duration: 0.1, repeat: 5, yoyo: true, ease: "none", onComplete: () => gsap.to(formRef.current, { x: 0 }) }
        );
    }
  };

  if (!isLocked) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl select-none overscroll-none touch-none h-[100dvh]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6">
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <div className={`w-1.5 h-1.5 rounded-full ${success ? "bg-[#dee5a0] shadow-[0_0_10px_#dee5a0]" : "bg-red-500 animate-pulse"}`} />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50">
                {success ? "Access Granted" : "Acceso Restringido"}
            </span>
            {success ? <Unlock className="w-3 h-3 text-[#dee5a0]" /> : <Lock className="w-3 h-3 text-white/30" />}
        </div>

        <h2 className="text-4xl md:text-5xl font-serif italic text-white text-center">
          Próximamente
        </h2>

        <form 
            ref={formRef} 
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center gap-4 mt-2"
        >
            <div className="relative w-full max-w-[240px] group">
                <input
                    ref={inputRef}
                    type="text" 
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                    }}
                    placeholder="ENTER PASSWORD"
                    // IMPORTANTE: autoFocus removido para evitar zoom al cargar
                    autoFocus={false} 
                    className={`
                        w-full bg-transparent border-b py-2 text-center font-mono tracking-[0.3em] uppercase outline-none transition-all duration-300
                        text-[16px] md:text-sm 
                        ${error 
                            ? "border-[#911e1e] text-[#911e1e] placeholder-[#911e1e]/50" 
                            : success 
                                ? "border-[#dee5a0] text-[#dee5a0]" 
                                : "border-white/20 text-white focus:border-white/60 placeholder-white/20"
                        }
                    `}
                    autoComplete="off"
                />
                
                <button 
                    type="submit"
                    className={`
                        absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-opacity duration-300
                        ${password.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}
                    `}
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 text-[9px] font-mono uppercase tracking-widest text-center">
                {error && <span className="text-[#911e1e]">Access Denied • Try Again</span>}
                {success && <span className="text-[#dee5a0]">Welcome to Gaceta</span>}
                {!error && !success && <span className="text-white/20 opacity-0 md:opacity-100">Press Enter to Unlock</span>}
            </div>
        </form>

        <div className="flex items-center gap-6 mt-8 opacity-50 hover:opacity-100 transition-opacity duration-500">
            <a href="https://instagram.com/esgaceta" target="_blank" rel="noreferrer">
                <FaInstagram className="w-5 h-5 text-white hover:text-[#dee5a0] transition-colors" />
            </a>
            <a href="https://x.com/esgaceta" target="_blank" rel="noreferrer">
                <FaTwitter className="w-5 h-5 text-white hover:text-[#dee5a0] transition-colors" />
            </a>
        </div>

      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-1 opacity-30">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white to-transparent" />
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white">
            Gaceta 
        </span>
      </div>

    </div>
  );
}