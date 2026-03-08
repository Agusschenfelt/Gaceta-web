import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import TransitionLink from "../TransitionLink";
import { useLocation } from "react-router-dom";
import { useMenu } from "./MenuStore";

const navLinks = [
  { name: "Nosotros", to: "/sobre-nosotros" },
  { name: "Artistas", to: "/artistas" },
  { name: "Gallery", to: "/gallery" },
  { name: "Shows", to: "/#shows" },
  { name: "Shop", to: "https://gaceta.shop/" },
];

function LinkOrA({ to, children, ...props }) {
  const isExt = typeof to === "string" && to.startsWith("http");

  if (isExt) {
    return <a href={to} target="_blank" rel="noreferrer" {...props}>{children}</a>;
  }

  return <TransitionLink to={to} {...props}>{children}</TransitionLink>;
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
    <header className="fixed inset-x-0 top-0 z-[80] w-full flex items-center justify-between px-6 md:px-10 h-20 pointer-events-none">

      {/* LOGO */}
      <TransitionLink
        to="/"
        className="relative z-[90] flex items-center group mix-blend-difference pointer-events-auto"
      >
        <picture>
          <source srcSet="/assets/logos/logo-gaceta-blanco.webp" type="image/webp" />
          <img
            src="/assets/logos/logo-gaceta-blanco.png"
            alt="Gaceta"
            className="block w-[120px] md:w-[150px] transition-opacity group-hover:opacity-80"
            data-logo="navbar-logo"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
      </TransitionLink>

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

      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function MenuOverlay({ open, onClose }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className={`fixed inset-0 z-[80] bg-black/90 backdrop-blur-2xl backdrop-saturate-150 flex flex-col
                  transition-opacity duration-500
                  ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
                open={open}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
                onClose={onClose}
              />
            ))}
          </ul>
        </nav>

        {/* Footer del Menú */}
        <div
          className={`mt-12 md:mt-16 pt-8 border-t border-white/10
                      transition-all duration-500 delay-300
                      ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

                {/* 1. Redes Sociales */}
                <div className="flex gap-6 text-xl text-white/50">
                    <a href="https://www.instagram.com/esgaceta" target="_blank" className="hover:text-white transition-colors"><FaInstagram/></a>
                    <a href="https://x.com/esgaceta" target="_blank" className="hover:text-white transition-colors"><FaTwitter/></a>
                    <a href="https://www.tiktok.com/@esgaceta" target="_blank" className="hover:text-white transition-colors"><FaTiktok/></a>
                    <a href="https://youtube.com/@esgaceta" target="_blank" className="hover:text-white transition-colors"><FaYoutube/></a>
                </div>

                {/* Separador visual */}
                <div className="hidden md:block w-px h-8 bg-white/10" />

                {/* 2. Créditos */}
                <div className="text-left">
                    <p className="text-white font-bold tracking-wide text-sm leading-tight">
                        @GACETA 2025
                    </p>
                    <p className="text-white/40 font-mono uppercase tracking-[0.15em] text-[10px] mt-1">
                        MADE BY GACETA
                    </p>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ link, index, open, hoveredIndex, setHoveredIndex, onClose }) {
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

  return (
    <li
      style={{ transitionDelay: open ? `${index * 50}ms` : '0ms' }}
      className={`relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]
                  ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      onMouseEnter={() => setHoveredIndex(index)}
    >
      <LinkOrA
        to={link.to}
        onClick={onClose}
        className={`group block text-5xl md:text-8xl font-bold tracking-tighter leading-[1.0] transition-all duration-500 ease-out outline-none text-white
          ${isDimmed ? "opacity-30 blur-[2px] scale-[0.98]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="relative overflow-hidden pb-2">

            {/* 1. TEXTO ORIGINAL (Sube al 120% para desaparecer) */}
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-[120%]">
                {link.name}
            </span>

            {/* 2. TEXTO HOVER (Viene del 120% abajo) */}
            <span className="absolute top-0 left-0 block font-serif italic text-[#dee5a0] translate-y-[120%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0">
                {link.name}
            </span>

            <ArrowUpRight className="absolute top-1/2 -right-12 -translate-y-1/2 text-[#dee5a0] w-8 h-8 md:w-12 md:h-12 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-0" />
        </div>
      </LinkOrA>
    </li>
  );
}
