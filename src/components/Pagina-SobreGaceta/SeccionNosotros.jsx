import FondoSeccionNosotros from "/assets/fondo-nosotros.webp";
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

export default function SeccionNosotros() {
  const presentacion = useRef();
  useGSAP(() => {
    const split = new SplitText(presentacion.current, { type: "words" });

    gsap.from(split.words, {
      duration: 1,
      y: 10,
      stagger: 0.2,
      autoAlpha: 0,
      filter: "blur(10px)",
    });
  });

  return (
    <section
      className="w-full h-[100vh] bg-cover bg-center"
      style={{ backgroundImage: `url(${FondoSeccionNosotros})` }}
    >
      <div className="absolute bg-black/40 h-full" />
      <div className="flex flex-col justify-between lg:justify-start lg:gap-20 py-12 mx-14 lg:mx-28 h-full z-10 relative">
        <div className="mt-12">
          <h2 className="titulo" ref={presentacion}>
            de la <span className="cursiva">esperanza</span>
            <br />
            al <span className="cursiva">primer paso</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-white font-inter font-normal text-base lg:text-[1.3rem] lg:max-w-[600px] leading-normal max-w-prose mb-4 tracking-tight">
            Gaceta es un sello independiente y comunidad de artistas del Río de
            la Plata, especializado en el desarrollo integral de proyectos
            musicales. Acompañamos a los artistas desde la canción hasta la
            imagen: planificamos lanzamientos, distribuimos su música y
            producimos el contenido audiovisual que necesitan. Nos enfocamos en
            crear piezas que conecten con la audiencia, combinando creatividad,
            estrategia y producción de calidad para potenciar su alcance y
            construir carreras a largo plazo.
          </p>
          <div>
            <span className="text-sm lg:text-xl text-white font-inter mb-1">
              <span className="cursiva">based in</span> Argentina &amp; Uruguay
            </span>
            <div className="mt-1 h-px w-32 bg-white opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
