export default function NavDesktop() {
  return (
    <div className="flex items-center justify-between px-12 py-9 bg-[#000000d1] text-white fixed w-full z-50">
      <img src="src/assets/logo-gaceta-blanco.png" alt="Logo" className='h-auto w-[11%]' />
      <ul className="flex gap-16 inter text-[1.15rem] font-light">
        {['#SobreNosotros','#Artistas','#GacetaTV','#Live'].map(link => (
          <li key={link}><a href={link}>{link}</a></li>
        ))}
      </ul>
      <button className='rounded-full font-medium text-base leading-none inter transition py-2 px-5 w-[6rem] bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500'>Shop</button>
    </div>
  )
}