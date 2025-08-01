import Fondo from "../../assets/equipo-gaceta.jpg"

export default function SeccionSumate() {
    return (
        <section className="h-[80vh] py-24 w-full flex flex-col gap-10 items-center bg-cover bg-center" style={{ backgroundImage: `url(${Fondo})` }}>
            <h2 className="titulo"><span className="cursiva">sumate a <br /></span>Gaceta</h2>
            <button className="rounded-full inline-flex items-center justify-center font-normal text-normal leading-tight transition mx-auto h-16 px-6 w-[170px] lg:h-9 lg:w-[20%] lg:px-4 lg:text-lg inter bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">Compartí tu propuesta</button>
        </section>
    )
}