export default function NavDesktop() {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-black text-white">
      <ul className="flex gap-8">
        {['#SobreNosotros','#Artistas','#GacetaTV','#Live'].map(link => (
          <li key={link}><a href={link}>{link}</a></li>
        ))}
      </ul>
      <button>Shop</button>
    </div>
  )
}