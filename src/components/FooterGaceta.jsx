import { Link } from "react-router-dom";
import { redesSociales } from "../data/redes";

export default function FooterGaceta() {
  return (
    <footer className="bg-orange-600 text-white p-1 py-10 flex gap-2 justify-around items-start" >
      <div className="flex flex-col items-center gap-4">
        <img src="src/assets/logo-gaceta-blanco.png" loading="lazy" alt="Logo Gaceta" className="size-24 object-cover shadow-2xl" />
        <p>© 2025 Gaceta</p>
      </div>
      <div className="text-center flex flex-col items-center gap-2">
        <a href="">GacetaShop</a>
        <a href="">GacetaNews</a>
      </div>
      <div className="text-center ">
        <ul className="flex flex-col items-start gap-2">
            {redesSociales.map((red) => (
            <li key={red.nombre}>
              <a
                href={red.url}
                target="_blank"
                rel="noopener"
                aria-label={red.nombre}
              >
                {red.nombre}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
