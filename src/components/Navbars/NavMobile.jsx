import { useState, useEffect } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'

export default function NavMobile() {
  const [isOpen, setIsOpen] = useState(false)

  // Bloquear scroll de fondo
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }, [isOpen])

  const navItems = [
    { label: '#SobreNosotros', href: '/#SobreNosotros' },
    { label: '#Artistas',       href: '/#Artistas'       },
    { label: '#GacetaTV',       href: '/#GacetaTV'       },
    { label: '#Live',           href: '/#Live'           },
  ]

  return (
    <>
      <header className="h-[80px] flex items-center justify-between px-4 fixed w-full bg-[#000000d1] text-white md:hidden z-50">
        <img
          src="src/assets/logo-gaceta-blanco.png"
          alt="Logo"
          className="w-[112px] h-auto"
        />
        <button onClick={() => setIsOpen(true)} aria-label="Abrir menú">
          <Bars3Icon className="h-8 w-8 text-white " />
        </button>
      </header>

      <div className="fixed inset-0 z-50 flex pointer-events-none md:hidden">
        <div
          className={`
            flex-1
            bg-black
            transition-opacity duration-300
            ${isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0'}
          `}
          onClick={() => setIsOpen(false)}
        />
        <div
          className={`
            w-3/4 max-w-xs
            bg-red-600 text-white
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            pointer-events-auto
            rounded-l-3xl
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="flex justify-end p-8">
            <button onClick={() => setIsOpen(false)} aria-label="Cerrar menú">
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
          <nav className="flex flex-col space-y-6 pl-10 mt-10">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="text-xl hover:underline"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 px-10 py-6">
            <a
              href="/shop"
              className="block text-center bg-white text-red-600 py-2 rounded-full font-medium"
            >
              Shop
            </a>
          </div>
        </div>
      </div>
    </>
  )
}