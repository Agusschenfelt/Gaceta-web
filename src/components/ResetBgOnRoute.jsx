// components/ResetBgOnRoute.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HOME_BG = "#0a0a0a"; // mismo que --color-fondo en :root

export default function ResetBgOnRoute() {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;

    // Matamos cualquier ScrollTrigger que esté animando el <html>
    ScrollTrigger.getAll().forEach((st) => {
      const anim = st.animation;
      if (!anim) return;
      const targets = anim.targets && anim.targets();
      if (targets && targets.includes(root)) {
        st.kill();
      }
    });

    // Reseteamos explícitamente el fondo
    gsap.set(root, { "--pageBg": HOME_BG });
  }, [location.pathname]);

  return null;
}
