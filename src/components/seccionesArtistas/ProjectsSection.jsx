import ModalProjects from "./ModalProjects";
import { useState } from 'react';

export default function ( {projects} ) {
    const [modalProject, setModalProject] = useState(null);
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-16 md:gap-6 mb-20 mx-12 justify-items-center">
            {projects.map(p => (
                <div key={p.id} className="relative">
                    <img
                        src={p.cover}
                        alt={p.title}
                        className="rounded-3xl cursor-pointer hover:opacity-80 h-80 w-full object-cover"
                        onClick={() => setModalProject(p)}
                    />
                    <p className="mt-2 text-center text-lg font-inter">{p.title}</p>
                </div>
            ))}
            {modalProject && (
                <ModalProjects 
                    img={modalProject.cover}
                    title={modalProject.title}
                    date={modalProject.date}
                    producer={modalProject.producer}
                    spotify={modalProject.spotify}
                    bio={modalProject.bio} 
                    onClose={() => setModalProject(null)} 
                />
            )}
        </section>
    )
    
}