import { getTripData } from '@/lib/api';

export default async function TripPage({ params }: { params: { tripId: string } }) {
  const data = await getTripData(params.tripId);

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 bg-[#FAFAFA] min-h-screen">
      <header className="mb-24 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-800 mb-4">{data.tripName}</h1>
        <p className="text-sm tracking-widest text-gray-400 uppercase">Documentary with Yoh</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {data.items.map((item: any, index: number) => (
          <div key={index} className="group">
            <div className="overflow-hidden bg-white shadow-sm border border-gray-100">
              {item.type === 'video' ? (
                <video src={item.content} controls className="w-full h-auto" />
              ) : item.type === 'image' ? (
                <img src={item.content} alt={item.comment} className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="p-12 text-center italic text-gray-500 font-serif leading-relaxed">
                  "{item.content}"
                </div>
              )}
            </div>
            {item.comment && (
              <p className="mt-6 text-sm text-gray-600 font-serif leading-relaxed px-2">
                {item.comment}
              </p>
            )}
            <p className="mt-2 text-[10px] tracking-tighter text-gray-300 px-2 uppercase">
              {new Date(item.timestamp).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}