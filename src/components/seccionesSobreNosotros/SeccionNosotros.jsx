import FondoSeccionNosotros from "../../assets/fondo-nosotros.webp"
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(SplitText, useGSAP);

export default function SeccionNosotros() {
    const presentacion = useRef();
    useGSAP(() => {
        const split = new SplitText(presentacion.current, {type: "words"});

        gsap.from(split.words, {
            duration: 1,
            y: 10,
            stagger: 0.2,
            autoAlpha: 0,
            filter: 'blur(10px)',
        })
    })

  return (
    <section className="mt-20 sm:mt-28 w-full h-[92vh] bg-cover bg-center" style={{ backgroundImage: `url(${FondoSeccionNosotros})` }}>
      <div className="absolute bg-black/40 h-full" />
      <div className="flex flex-col justify-between lg:justify-start lg:gap-20 py-12 mx-14 lg:mx-28 h-full z-10 relative">
        <div>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
            #SobreNosotros
            </span>
            <h2 className="titulo" ref={presentacion}>
            de la <span className="cursiva">esperanza</span>
            <br />
            al <span className="cursiva">primer paso</span>
            </h2>
        </div>

        <div className="flex flex-col gap-3">
            <p className="text-white font-inter font-normal text-base lg:text-2xl lg:max-w-[600px] leading-normal max-w-prose mb-4 tracking-tight">
                Somos una productora audiovisual y estudio creativo, especializada en el
                desarrollo audiovisual de proyectos musicales. Nos enfocamos en crear
                piezas que conecten con la audiencia, combinando creatividad, estrategia
                y produccion de calidad para destacar en un entorno competitivo
            </p>
            <div>
                <span className="text-sm lg:text-xl text-white font-inter mb-1"><span className="cursiva">based in</span> Argentina &amp; Uruguay</span>
                <div className="mt-1 h-px w-32 bg-white opacity-80" />
            </div>

        </div>
      </div>
    </section>
  );
}
