import FondoSeccionNosotros from "../../assets/fondo-nosotros.webp"

export default function SeccionNosotros() {
  return (
    <section className="mt-20 w-full h-[92vh] bg-cover bg-center" style={{ backgroundImage: `url(${FondoSeccionNosotros})` }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="flex flex-col justify-between py-12 mx-14 h-full z-10 relative">
        <div>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
            #SobreNosotros
            </span>
            <h2 className="titulo">
            de la <span className="cursiva">esperanza</span>
            <br />
            al <span className="cursiva">primer paso</span>
            </h2>
        </div>

        <div className="flex flex-col gap-3">
            <p className="text-white font-inter font-normal text-base leading-normal max-w-prose mb-4 tracking-tight">
                Somos una productora audiovisual y estudio creativo, especializada en el
                desarrollo audiovisual de proyectos musicales. Nos enfocamos en crear
                piezas que conecten con la audiencia, combinando creatividad, estrategia
                y produccion de calidad para destacar en un entorno competitivo
            </p>
            <div>
                <span className="text-sm text-white font-inter mb-1"><span className="cursiva">based in</span> Argentina &amp; Uruguay</span>
                <div className="mt-1 h-px w-32 bg-white opacity-80" />
            </div>

        </div>
      </div>
    </section>
  );
}
