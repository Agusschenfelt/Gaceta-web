import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from 'react-icons/fa';

export default function FooterGaceta() {
  return (
    <footer className="bg-orange-600 text-white relative">
      <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 gap-4 md:grid-cols-3 md:py-10">
        {/* Brand: ocupa 2 cols en móvil */}
        <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start">
          <img src="src/assets/logo-gaceta-blanco.png" alt="Gaceta Logo" className="h-8 mb-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <p className="text-xs hidden md:block">Creando experiencias únicas</p>
        </div>

      {/* Enlaces: sólo título en móvil, lista en md */}
      <div className="flex flex-col items-start ml-4">
        <h3 className="font-semibold mb-2 text-sm">Enlaces</h3>
        <ul className="space-y-1 text-[.8rem]">
          <li><a href="/sobre-nosotros" className="hover:underline">Sobre Nosotros</a></li>
          <li><a href="/contacto" className="hover:underline">Contacto</a></li>
          <li><a href="/terminos" className="hover:underline">Términos y privacidad</a></li>
        </ul>
      </div>

    {/* Redes sociales */}
      <div className="flex flex-col items-center md:items-end">
        <h3 className="font-semibold mb-2 text-sm">Seguinos</h3>
        <div className="flex space-x-3 text-xl">
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Twitter"><FaTwitter /></a>
          <a href="#" aria-label="TikTok"><FaTiktok /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
        </div>
      </div>
    </div>

    <div className="border-t border-orange-500">
      <p className="text-center text-xs py-3">
        © 2025 Gaceta. Todos los derechos reservados.
      </p>
    </div>
  </footer>

  );
}
