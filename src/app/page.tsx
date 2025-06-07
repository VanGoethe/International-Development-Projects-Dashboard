import MapboxMap from "../components/MapboxMap";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="absolute top-0 left-0 right-0 z-[100] p-2 px-4 bg-gray-50/80 border-b border-gray-300">
        <h1 className="m-0 text-xl font-medium text-gray-800">
          Afghanistan Development Projects Dashboard
        </h1>
      </header>
      <main className="flex-1 relative h-screen">
        <MapboxMap />
      </main>
    </div>
  );
}
