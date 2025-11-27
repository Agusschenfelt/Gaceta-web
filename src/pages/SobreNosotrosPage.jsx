// src/pages/SobreNosotrosPage.jsx
import { useEffect, useState } from 'react';
import SeccionNosotros from '../components/Pagina-SobreGaceta/SeccionNosotros';
import SeccionSumate from '../components/Pagina-SobreGaceta/SeccionSumate';
import SeccionEquipos from '../components/Pagina-SobreGaceta/SeccionEquipos';
import TimelineHorizontal from '../components/Pagina-SobreGaceta/TimeLineHorizontal';
import TimelineMobile from '../components/Pagina-SobreGaceta/TimelineMobile';
import SEO from "../SEO.jsx";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
      <div className="bg-[#0a0a0a] min-h-screen">
        <SeccionNosotros />
        {isMobile ? <TimelineMobile /> : <TimelineHorizontal />}
        <SeccionEquipos />
        <SeccionSumate />
      </div>
    </>
  );
}
