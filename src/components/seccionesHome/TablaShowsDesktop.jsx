export default function TablaShowsDesktop() {
  return (
    <table className="w-full text-left text-white">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="px-6 py-4 font-semibold">Fecha</th>
          <th className="px-6 py-4 font-semibold">Lugar</th>
          <th className="px-6 py-4 font-semibold">Ciudad</th>
          <th className="px-6 py-4 font-semibold">Entradas</th>
        </tr>
      </thead>
      <tbody>
        {/* Aquí irían las filas de shows */}
      </tbody>
    </table>
  );
}