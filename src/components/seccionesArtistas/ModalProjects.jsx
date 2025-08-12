export default function ModalProjects({ img, title, date, producer, bio, spotify, onClose }) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-black md:rounded-[80px] rounded-[40px] overflow-hidden w-[75%] md:w-[60%] max-w-[850px] md:max-h-[70%] max-h-[70%] h-full md:p-10 p-5 relative flex flex-col md:justify-center justify-start items-center gap-5 pt-14"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-5 right-7 text-white hover:text-white/70 text-3xl font-extrabold"
            onClick={onClose}
          >
            ✕
          </button>
          <div className="flex flex-col items-center gap-3">
            <img src={img} alt={title} className="md:size-56 size-48 md:rounded-[60px] rounded-[40px]"/>
            <h3 className="text-xl font-normal font-inter">{title}</h3>
            <div>
              <p className="font-inter">Lanzamiento: {date}</p>
              <p className="font-inter">Producido por: {producer}</p>
            </div>
          </div>
          <div className="flex flex-col align-center justify-center gap-5">
            <p className="md:text-xl text-base font-light cursiva md:max-w-[60%] text-center">{bio}</p>
            <a href={spotify} target='_blank'className="mx-auto">
              <button className="rounded-full inline-flex items-center justify-center  text-base leading-tight mx-auto h-full p-1 w-[11rem] lg:text-lg font-inter bg-green-600">Abrir en Spotify</button>
            </a>
          </div>
        </div>
      </div>
    );
  }
  