// src/pages/SobreNosotrosPage.jsx
import { useEffect, useState, lazy, Suspense } from 'react';
import SeccionNosotros from '../components/Pagina-SobreGaceta/SeccionNosotros';
import SeccionSumate from '../components/Pagina-SobreGaceta/SeccionSumate';
import SeccionEquipos from '../components/Pagina-SobreGaceta/SeccionEquipos';
import SEO from "../SEO.jsx";

const TimelineHorizontal = lazy(() => import('../components/Pagina-SobreGaceta/TimeLineHorizontal'));
const TimelineMobile = lazy(() => import('../components/Pagina-SobreGaceta/TimelineMobile'));

// Module-level, so the hook's effect has no function dependency to track and
// both uses share one guarded construction (null where matchMedia is missing).
function mobileQuery(breakpoint) {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    : null;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => mobileQuery(breakpoint)?.matches ?? false);

  useEffect(() => {
    const mq = mobileQuery(breakpoint);
    if (!mq) return undefined;
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}

export default function SobreNosotrosPage() {
  const isMobile = useIsMobile();

  return (
    <>
      <SEO 
        title="Sobre Nosotros"
        description="De la esperanza al primer paso. Conoce la historia de Gaceta, nuestra filosofía de trabajo y el equipo detrás de los artistas."
        url="/sobre-nosotros"
      />
      <div className="bg-fondo min-h-[100svh]">
        <SeccionNosotros />
        <Suspense fallback={<div role="status" aria-busy="true" className="h-[40vh]" />}>
          {isMobile ? <TimelineMobile /> : <TimelineHorizontal />}
        </Suspense>
        <SeccionEquipos />
        <SeccionSumate />
      </div>
    </>
  );
}
