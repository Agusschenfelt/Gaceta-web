export default function TablaShowsDesktop({ shows }) {
  return (
    <div className="overflow-x-auto mt-12">
      <table className="w-[70%] table-auto text-left text-white m-auto">
        <tbody>
          {shows.map((show, idx) => (
            <tr
              key={idx}
              className="border-b-[1px] border-gray-500 hover:bg-gray-900 transition-colors"
            >
              <td className="px-4 py-3 font-instrument text-[1.4rem]">{show.artista}</td>
              <td className="px-4 py-3 flex font-inter font-medium text-[1.15rem] tracking-tight items-center gap-1">
                {show.ciudad} <span>({show.pais})</span>
              </td>
              <td className="px-4 py-3 font-inter font-medium text-[1.15rem] tracking-tight">{show.fecha}</td>
              <td className="px-4 py-3 font-inter font-medium text-[1.15rem] tracking-tight">{show.lugar}</td>
              <td className="px-4 py-3 font-inter font-medium text-[1.15rem] tracking-tight">
                {show.soldOut ? (
                  <span className="text-red-500 font-normal line-through decoration-1 mx-1">SOLD OUT</span>
                ) : (
                  <a
                    href={show.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-orange-600 text-white px-6 py-1 rounded-full text-base font-medium">
                      Entradas
                    </button>
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}