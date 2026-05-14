import SEO from "../SEO";
import TransitionLink from "../components/TransitionLink";

export default function NotFoundPage() {
  return (
    <>
      <SEO title="404" description="Página no encontrada." />
      <main className="h-full-screen w-full bg-fondo flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">

        {/* Ruido de fondo */}
        <div aria-hidden="true" className="noise-texture absolute inset-0 opacity-[0.05] pointer-events-none" />

        <p aria-hidden="true" className="text-[12rem] md:text-[20rem] font-black text-white/[0.06] leading-none select-none">
          404
        </p>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <p className="text-secundario font-mono uppercase tracking-[0.2em] mb-4 text-sm">
                Lost in the noise
            </p>
            <h1 className="text-3xl md:text-5xl font-serif italic text-white mb-8">
                Esta página no existe.
            </h1>

            <TransitionLink
                to="/"
                className="px-8 py-3 rounded-sm border border-white/20 text-white hover:bg-white hover:text-black transition-[background-color,color] duration-300 uppercase tracking-widest text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
            >
                Volver al inicio
            </TransitionLink>

            <div className="flex items-center gap-6 mt-6">
              {[
                { to: "/artistas", label: "Artistas" },
                { to: "/#shows", label: "Shows" },
                { to: "/gallery", label: "Gallery" },
              ].map(({ to, label }) => (
                <TransitionLink
                  key={to}
                  to={to}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-secundario transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secundario rounded-sm"
                >
                  {label}
                </TransitionLink>
              ))}
            </div>
        </div>
      </main>
    </>
  );
}