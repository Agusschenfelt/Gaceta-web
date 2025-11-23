

export default function SeccionSumate() {
  const gmailComposeUrl =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    "&to=contacto@gacetaplay.com" +
    "&su=Propuesta%20para%20Gaceta" +
    "&body=Hola%20Gaceta,%0A%0ANombre:%20%0AProyecto:%20%0ALinks:%20%0ADetalle:%20%0A%0AGracias!";

  return (
    <section className="h-[80vh] w-full flex flex-col items-center justify-center bg-black text-center px-4">
      {/* Título (tus tipografías) */}
      <h2 className="titulo">
        <span className="cursiva">
          sumate a <br />
        </span>
        Gaceta
      </h2>

      {/* Subtítulo sutil */}
      <p className="mt-6 text-sm md:text-base text-white/60 max-w-md">
        ¿Tenés una idea o proyecto para sumar a Gaceta? <br />
        Escribinos y contanos tu propuesta.
      </p>

      {/* Botón -> Gmail compose */}
      <a
        href={gmailComposeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 rounded-full inline-flex items-center justify-center
                   font-normal leading-tight mx-auto h-12 px-8
                   lg:h-10 lg:px-6 lg:text-lg inter
                   bg-white text-black border border-white
                   hover:bg-black hover:text-white
                   transition-transform transition-shadow duration-200
                   hover:scale-105 hover:-translate-y-0.5
                   shadow-[0_8px_22px_rgba(255,140,0,0.25)]
                   animate-pulse hover:animate-none"
      >
        Compartí tu propuesta
      </a>
    </section>
  );
}
