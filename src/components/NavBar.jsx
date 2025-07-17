import NavDesktop from './Navbars/NavDesktop'
import NavMobile  from './Navbars/NavMobile'

export default function NavBar() {
  return (
    <nav className="w-full">
      {/* Desktop: oculto en md+ */}
      <div className="hidden md:block">
        <NavDesktop />
      </div>
      {/* Mobile: sólo visible <md */}
      <div className="block md:hidden">
        <NavMobile />
      </div>
    </nav>
  )
}