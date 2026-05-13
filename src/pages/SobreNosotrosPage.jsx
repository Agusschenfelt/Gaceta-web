// src/pages/SobreNosotrosPage.jsx
import { useEffect, useState, lazy, Suspense } from 'react';
import SeccionNosotros from '../components/Pagina-SobreGaceta/SeccionNosotros';
import SeccionSumate from '../components/Pagina-SobreGaceta/SeccionSumate';
import SeccionEquipos from '../components/Pagina-SobreGaceta/SeccionEquipos';
import SEO from "../SEO.jsx";

const TimelineHorizontal = lazy(() => import('../components/Pagina-SobreGaceta/TimeLineHorizontal'));
const TimelineMobile = lazy(() => import('../components/Pagina-SobreGaceta/TimelineMobile'));

function useIsMobile(breakpoint = 768) {
  const getMq = () =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
      : null;

  const [isMobile, setIsMobile] = useState(() => getMq()?.matches ?? false);

  useEffect(() => {
    const mq = getMq();
    if (!mq) return;
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
