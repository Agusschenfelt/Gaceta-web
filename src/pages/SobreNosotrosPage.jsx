// src/pages/SobreNosotrosPage.jsx
import { useEffect, useState } from 'react';
import SeccionNosotros from '../components/Pagina-SobreGaceta/SeccionNosotros';
import SeccionSumate from '../components/Pagina-SobreGaceta/SeccionSumate';
import SeccionEquipos from '../components/Pagina-SobreGaceta/SeccionEquipos';
import TimelineHorizontal from '../components/Pagina-SobreGaceta/TimeLineHorizontal';
import TimelineMobile from '../components/Pagina-SobreGaceta/TimelineMobile';

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
    <div className="bg-black flex flex-col min-h-screen gap-40">
      <SeccionNosotros />
      {isMobile ? <TimelineMobile /> : <TimelineHorizontal />}
      <SeccionEquipos />
      <SeccionSumate />
    </div>
  );
}
