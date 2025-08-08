import NavDesktop from './Navbars/NavDesktop'
import NavMobile  from './Navbars/NavMobile'

export default function NavBar() {
  return (
    <header>
      <nav className="w-full">
        <div className="hidden lg:block">
          <NavDesktop />
        </div>
        
        <div className="block lg:hidden">
          <NavMobile />
        </div>
      </nav>
    </header>
  )
}