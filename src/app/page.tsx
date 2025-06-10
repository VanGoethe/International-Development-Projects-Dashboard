import MapboxMap from "../components/MapboxMap";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="p-2 px-4 bg-gray-50/80 border-b border-gray-300">
        <h1 className="m-0 text-xl font-medium text-gray-800">
          International Development Projects Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Tracking foreign aid impact across multiple countries affected by aid
          cuts
        </p>
      </header>
      <main className="flex-1 relative">
        <MapboxMap />
      </main>
    </div>
  );
}
