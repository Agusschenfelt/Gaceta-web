export default function ArtistHeader( {name, tab}) {
    return (
        <header className="flex justify-between items-start md:items-end mb-8 mx-8 mr-16 md:mx-20 mt-20 sm:mt-32">
        <div className='flex flex-col gap-3'>
              <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
                #Artista
              </span>
              <h2 className="titulo">
                <span className='cursiva'>{name}</span>
              </h2>
          </div>
          <nav className="flex space-x-6 flex-col md:flex-row gap-3">
            <button
              onClick={() => setTab('bio')}
              className={`text-lg md:text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'bio' ? 'text-orange-500' : 'text-white'}`}
            >
              bio
            </button>
            <button
              onClick={() => setTab('projects')}
              className={`text-lg md:text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'projects' ? 'text-orange-500' : 'text-white'}`}
            >
              projects
            </button>
            <button
              onClick={() => setTab('liveset')}
              className={`text-lg md:text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'liveset' ? 'text-orange-500' : 'text-white'}`}
            >
              liveset
            </button>
          </nav>
        </header>
    )
}