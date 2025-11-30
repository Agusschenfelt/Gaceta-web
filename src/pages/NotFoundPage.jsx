import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function NotFoundPage() {
  return (
    <>
      <SEO title="404" description="Página no encontrada." />
      <main className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        
        {/* Ruido de fondo */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

        <h1 className="text-[12rem] md:text-[20rem] font-black text-[#111] leading-none select-none">
          404
        </h1>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <p className="text-[#dee5a0] font-mono uppercase tracking-[0.2em] mb-4 text-sm">
                Lost in the noise
            </p>
            <h2 className="text-3xl md:text-5xl font-serif italic text-white mb-8">
                Esta página no existe.
            </h2>
            
            <Link 
                to="/"
                className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-xs"
            >
                Volver al inicio
            </Link>
        </div>
      </main>
    </>
  );
}