import ArtistsGrid from "../components/seccionesArtistas/ArtistsGrid";

export default function AllArtistsPage({artists}) {
  return (
    <div className="bg-black flex flex-col min-h-screen">
        <ArtistsGrid artists={artists}/>
    </div>
  );
}