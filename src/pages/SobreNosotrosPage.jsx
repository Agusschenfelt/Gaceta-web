import SeccionNosotros from '../components/seccionesSobreNosotros/SeccionNosotros';
import SeccionSumate from '../components/seccionesSobreNosotros/SeccionSumate';

export default function SobreNosotrosPage() {
  return (
    <div className="bg-black flex flex-col min-h-screen gap-40">
        <SeccionNosotros />
        <SeccionSumate />
    </div>
  );
}