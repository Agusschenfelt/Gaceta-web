import { useState, useEffect } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { Link } from 'react-router-dom'

export default function NavMobile() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }, [isOpen])

  const navItems = [
    { label: 'SobreNosotros', href: '/sobre-nosotros' },
    { label: 'Artistas',       href: '/artistas'       },
    { label: 'GaceTV',       href: '#gacetv'       },
    { label: 'Live',           href: '#live'           },
  ]

  return (
    <>
      <header className="h-[80px]  sm:h-[90px] flex items-center justify-between px-9 sm:px-14 fixed w-full bg-[#000000d1] text-white lg:hidden z-50">
        <Link to='/'>
          <img
            src="/assets/logo-gaceta-blanco.png"
            alt="Logo"
            className="w-[112px] sm:w-[120px] h-auto"
          />
        </Link>
        <button onClick={() => setIsOpen(true)} aria-label="Abrir menú">
          <Bars3Icon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
        </button>
      </header>

      <div className="fixed inset-0 z-50 flex pointer-events-none lg:hidden">
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
              <Link
                key={item.href}
                to={item.href}
                className="text-xl hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 px-10 py-6">
            <a
              href="https://gaceta.shop/"
              className="block text-center bg-white text-red-600 py-2 rounded-full font-medium"
              target='_blank'
            >
              Shop
            </a>
          </div>
        </div>
      </div>
    </>
  )
}