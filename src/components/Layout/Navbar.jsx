// Navbar.jsx
import { useEffect, useRef, forwardRef } from "react";
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
  { name: "Shop", to: "https://gaceta.shop/" },
];

export default function Navbar() {
  const { open, setOpen } = useMenu();
  const btnRef = useRef(null);
  const location = useLocation();

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    const html = document.documentElement;
    if (open) html.classList.add("overflow-hidden");
    else html.classList.remove("overflow-hidden");

    return () => html.classList.remove("overflow-hidden");
  }, [open]);

  // Escape para cerrar
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setOpen]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between
                 px-4 sm:px-6 text-white h-16 md:h-20"
    >
      {/* Logo */}
      <Link to="/" className="relative z-50 flex items-center">
        <img
          src="assets/logo-blanco.png"
          alt="Gaceta"
          className="block w-[120px] sm:w-[150px] md:w-[170px]"
        />
      </Link>

      {/* Botón MENU */}
      <button
        ref={btnRef}
        aria-controls="site-menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`uppercase text-xs sm:text-sm tracking-[0.25em]
                    hover:opacity-80 focus:outline-none
                    focus-visible:ring-2 focus-visible:ring-white/60
                    font-inter transition-opacity
                    ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        Menu
      </button>

      <MenuOverlay
        open={open}
        onClose={() => setOpen(false)}
        initialFocusRef={btnRef}
      />
    </header>
  );
}

function MenuOverlay({ open, onClose, initialFocusRef }) {
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] text-white font-inter overflow-y-auto"
        >
          {/* Fondo blur */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 130, damping: 20 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
          />

          {/* Contenido menú */}
          <div className="relative z-10 max-h-full flex flex-col">
            {/* Botón CERRAR arriba */}
            <div className="sticky top-0 flex justify-end px-4 sm:px-6 pt-6 pb-4 bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={onClose}
                className="uppercase text-xs sm:text-sm tracking-[0.25em] hover:opacity-80 font-inter"
              >
                Cerrar
              </button>
            </div>

            <div className="container mx-auto px-4 sm:px-6 pb-10 flex-1">
              <div className="grid md:h-[calc(100vh-80px)] md:grid-cols-12 md:grid-rows-[1fr_auto]">
                <motion.nav
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {
                      transition: {
                        staggerChildren: 0.05,
                        staggerDirection: -1,
                      },
                    },
                    show: {
                      transition: {
                        staggerChildren: 0.08,
                      },
                    },
                  }}
                  className="md:row-start-1 md:col-span-6 flex flex-col justify-center
                             pt-4 md:pt-0 pb-8 md:pb-12 md:items-start"
                >
                  {/* Links grandes */}
                  <ul className="space-y-6 sm:space-y-8 md:space-y-10 text-left">
                    {navLinks.map((link, i) => (
                      <MenuItem
                        key={link.name}
                        link={link}
                        ref={i === 0 ? firstLinkRef : undefined}
                      />
                    ))}
                  </ul>

                  {/* Redes */}
                  <div className="mt-8 flex items-center justify-start gap-5 text-white/90 text-lg">
                    <a
                      href="https://www.instagram.com/gacetaplay/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                    >
                      <FaInstagram />
                    </a>
                    <a
                      href="https://x.com/gacetaplay"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter / X"
                    >
                      <FaTwitter />
                    </a>
                    <a
                      href="https://www.tiktok.com/@gaceta.play"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="TikTok"
                    >
                      <FaTiktok />
                    </a>
                    <a
                      href="https://www.youtube.com/@gacetaplay"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                    >
                      <FaYoutube />
                    </a>
                  </div>

                  {/* Línea + crédito */}
                  <div className="mt-8 h-px w-32 sm:w-40 bg-gradient-to-r from-white/20 to-transparent" />

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.28 }}
                    className="mt-4 text-[10px] sm:text-xs uppercase tracking-wider text-white/60"
                  >
                    <a
                      href="https://www.instagram.com/gacetaplay/"
                      target="_blank"
                      rel="noreferrer"
                      className="block font-semibold hover:text-white/80"
                    >
                      @GACETA 2025
                    </a>
                    <span className="block opacity-70">Made by Gaceta</span>
                  </motion.div>
                </motion.nav>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
};

const MenuItem = forwardRef(function MenuItem({ link }, ref) {
  const { setOpen } = useMenu();

  const isExternal =
    typeof link.to === "string" && /^https?:\/\//.test(link.to);

  const commonClasses =
    "group inline-flex items-center gap-3 " +
    "text-5xl sm:text-6xl md:text-7xl " + // GRANDE como antes
    "font-semibold tracking-tight outline-none " +
    "focus-visible:ring-2 focus-visible:ring-white/60 text-white";

  const handleClick = () => {
    setOpen(false);
  };

  return (
    <motion.li variants={itemVariants}>
      {isExternal ? (
        <a
          ref={ref}
          href={link.to}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          className={commonClasses}
        >
          <span>{link.name}</span>
          <ArrowUpRight className="size-8 translate-y-1 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:rotate-0 -translate-x-1 rotate-12" />
        </a>
      ) : (
        <Link
          ref={ref}
          to={link.to}
          onClick={handleClick}
          className={commonClasses}
        >
          <span>{link.name}</span>
          <ArrowUpRight className="size-8 translate-y-1 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:rotate-0 -translate-x-1 rotate-12" />
        </Link>
      )}
    </motion.li>
  );
});
