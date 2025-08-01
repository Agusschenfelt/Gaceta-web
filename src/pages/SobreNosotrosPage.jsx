import FooterGaceta from '../components/FooterGaceta'
import NavBar from '../components/NavBar'
import SeccionNosotros from '../components/seccionesSobreNosotros/SeccionNosotros'
import SeccionProyectos from '../components/seccionesSobreNosotros/SeccionProyectos'
import SeccionSumate from '../components/seccionesSobreNosotros/SeccionSumate'

export default function SobreNosotrosPage() {
  return (
    <div className="bg-black flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 flex flex-col gap-40">
        <SeccionNosotros />
        <SeccionProyectos />
        <SeccionSumate />
      </main>
      <FooterGaceta/>
    </div>
  )
}