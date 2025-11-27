import { useEffect, useRef, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useMenu } from "./MenuStore";

const navLinks = [
  { name: "Nosotros", to: "/sobre-nosotros" },
  { name: "Artistas", to: "/#artistas" },
  { name: "Gallery", to: "/gallery" },
  { name: "Shows", to: "/#shows" },
  { name: "Shop", to: "https://tutienda.tiendanube.com/" }, 
];

function LinkOrA({ to, children, ...props }) {
  const isExt = typeof to === "string" && to.startsWith("http");
  if (isExt) {
    return <a href={to} target="_blank" rel="noreferrer" {...props}>{children}</a>;
  }
  return <Link to={to} {...props}>{children}</Link>;
}

export default function Navbar() {
  const { open, setOpen } = useMenu();
  const btnRef = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname, setOpen]);

  useEffect(() => {
    const html = document.documentElement;
    if (open) html.classList.add("overflow-hidden");
    else html.classList.remove("overflow-hidden");
    return () => html.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setOpen]);

  return (
    // CORRECCIÓN: 'w-full' asegura que ocupe todo el ancho
    <header className="fixed inset-x-0 top-0 z-[80] w-full flex items-center justify-between px-6 md:px-10 h-20 pointer-events-none">
      
      {/* LOGO */}
      <Link to="/" className="relative z-[90] flex items-center group mix-blend-difference pointer-events-auto">
        <img
          src="/assets/logo-blanco.png" 
          alt="Gaceta"
          className="block w-[120px] md:w-[150px] transition-opacity group-hover:opacity-80"
        />
      </Link>

      {/* BOTÓN MENU */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="relative z-[90] uppercase text-xs font-mono tracking-[0.25em] 
                   hover:text-[#dee5a0] transition-colors focus:outline-none 
                   mix-blend-difference text-white pointer-events-auto"
      >
        {open ? "Cerrar" : "Menu"}
      </button>

      {/* El overlay se renderiza aquí pero vive "fuera" visualmente */}
      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function MenuOverlay({ open, onClose }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }} // Curva de animación suave
          // CORRECCIÓN FONDO: Negro al 90% + Blur fuerte + Saturación baja
          // Esto crea el efecto "Dark Glass" elegante
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-2xl backdrop-saturate-150 flex flex-col pointer-events-auto"
        >
          <div className="flex-1 flex flex-col justify-center px-6 md:px-20 max-w-[1400px] mx-auto w-full">
            <nav>
              <ul 
                className="flex flex-col gap-1 md:gap-2"
                onMouseLeave={() => setHoveredIndex(null)} 
              >
                {navLinks.map((link, i) => (
                  <MenuItem
                    key={link.name}
                    link={link}
                    index={i}
                    hoveredIndex={hoveredIndex}
                    setHoveredIndex={setHoveredIndex}
                    onClose={onClose}
                  />
                ))}
              </ul>
            </nav>

            {/* Footer del Menú */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 md:mt-16 pt-8 border-t border-white/10"
            >
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                    
                    {/* 1. Redes Sociales */}
                    <div className="flex gap-6 text-xl text-white/50">
                        <a href="https://instagram.com" target="_blank" className="hover:text-white transition-colors"><FaInstagram/></a>
                        <a href="https://twitter.com" target="_blank" className="hover:text-white transition-colors"><FaTwitter/></a>
                        <a href="https://tiktok.com" target="_blank" className="hover:text-white transition-colors"><FaTiktok/></a>
                        <a href="https://youtube.com" target="_blank" className="hover:text-white transition-colors"><FaYoutube/></a>
                    </div>

                    {/* Separador visual (Línea vertical sutil) */}
                    <div className="hidden md:block w-px h-8 bg-white/10" />

                    {/* 2. Créditos (Movidos a la izquierda para que el Player no los tape) */}
                    <div className="text-left">
                        <p className="text-white font-bold tracking-wide text-sm leading-tight">
                            @GACETA 2025
                        </p>
                        <p className="text-white/40 font-mono uppercase tracking-[0.15em] text-[10px] mt-1">
                            MADE BY GACETA
                        </p>
                    </div>

                </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ link, index, hoveredIndex, setHoveredIndex, onClose }) {
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      onMouseEnter={() => setHoveredIndex(index)}
      className="relative overflow-hidden"
    >
      <LinkOrA
        to={link.to}
        onClick={onClose}
        className={`group block text-5xl md:text-8xl font-bold tracking-tighter leading-[1.1] transition-all duration-500 ease-out outline-none text-white
          ${isDimmed ? "opacity-30 blur-[2px] scale-[0.98]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="relative overflow-hidden py-1">
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full">
                {link.name}
            </span>
            <span className="absolute top-0 left-0 block font-serif italic text-[#dee5a0] translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0">
                {link.name}
            </span>
            <ArrowUpRight className="absolute top-1/2 -right-12 -translate-y-1/2 text-[#dee5a0] w-8 h-8 md:w-12 md:h-12 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-0" />
        </div>
      </LinkOrA>
    </motion.li>
  );
}