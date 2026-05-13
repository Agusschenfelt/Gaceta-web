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
  const overlayRef = useRef(null);
  const didOpenRef = useRef(false);
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

  // Gestión de foco: mover al primer link al abrir, restaurar al cerrar
  useEffect(() => {
    if (open) {
      didOpenRef.current = true;
      const firstFocusable = overlayRef.current?.querySelector("a, button");
      firstFocusable?.focus();
    } else if (didOpenRef.current) {
      btnRef.current?.focus();
    }
  }, [open]);

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
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="relative z-[90] uppercase text-xs font-mono tracking-[0.25em]
                   hover:text-secundario transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario
                   mix-blend-difference text-white pointer-events-auto
                   min-h-[44px] px-2 flex items-center"
      >
        {open ? "Cerrar" : "Menu"}
      </button>

      <MenuOverlay open={open} onClose={() => setOpen(false)} overlayRef={overlayRef} />
    </header>
  );
}

function MenuOverlay({ open, onClose, overlayRef }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Tab trap — confina el foco dentro del overlay mientras está abierto
  useEffect(() => {
    if (!open) return;
    const handleTab = (e) => {
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusables = Array.from(
        overlayRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [open, overlayRef]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      className={`fixed inset-0 z-[80] bg-black/90 backdrop-blur-2xl backdrop-saturate-150 flex flex-col overflow-y-auto
                  transition-opacity duration-500
                  ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex flex-col justify-center px-6 md:px-20 max-w-[1400px] mx-auto w-full min-h-full py-24 md:py-20">
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
          className={`mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10
                      transition-[opacity,transform] duration-500 delay-300
                      ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

                {/* 1. Redes Sociales */}
                <div className="flex gap-2 text-xl text-white/50">
                    <a href="https://www.instagram.com/esgaceta" target="_blank" rel="noreferrer" aria-label="Seguinos en Instagram" className="p-3 hover:text-white transition-colors"><FaInstagram/></a>
                    <a href="https://x.com/esgaceta" target="_blank" rel="noreferrer" aria-label="Seguinos en Twitter / X" className="p-3 hover:text-white transition-colors"><FaTwitter/></a>
                    <a href="https://www.tiktok.com/@esgaceta" target="_blank" rel="noreferrer" aria-label="Seguinos en TikTok" className="p-3 hover:text-white transition-colors"><FaTiktok/></a>
                    <a href="https://youtube.com/@esgaceta" target="_blank" rel="noreferrer" aria-label="Seguinos en YouTube" className="p-3 hover:text-white transition-colors"><FaYoutube/></a>
                </div>

                {/* Separador visual */}
                <div className="hidden md:block w-px h-8 bg-white/10" />

                {/* 2. Créditos */}
                <div className="text-left">
                    <p className="text-white font-bold tracking-wide text-sm leading-tight">
                        @GACETA 2026
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
  const { pathname } = useLocation();
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
  const isActive = link.to.startsWith("http")
    ? false
    : link.to === "/"
    ? pathname === "/"
    : pathname.startsWith(link.to);

  return (
    <li
      style={{ transitionDelay: open ? `${index * 50}ms` : '0ms' }}
      className={`relative overflow-hidden transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]
                  ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      onMouseEnter={() => setHoveredIndex(index)}
    >
      <LinkOrA
        to={link.to}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={`group block text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter leading-[1.0] transition-[opacity,filter,transform] duration-500 ease-out outline-none text-white
          ${isDimmed ? "opacity-30 blur-[2px] scale-[0.98]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="relative overflow-hidden pb-2">

            {/* 1. TEXTO ORIGINAL (Sube al 120% para desaparecer) */}
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-[120%]">
                {link.name}
            </span>

            {/* 2. TEXTO HOVER (Viene del 120% abajo) */}
            <span className="absolute top-0 left-0 block font-serif italic text-secundario translate-y-[120%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0">
                {link.name}
            </span>

            <ArrowUpRight className="absolute top-1/2 -right-12 -translate-y-1/2 text-secundario w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-0 -translate-x-4 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-hover:-translate-x-0" />
        </div>
      </LinkOrA>
    </li>
  );
}
