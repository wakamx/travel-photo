// データの型定義
type TravelItem = {
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string; // Google ドライブのURL
  comment: string;
};

type ApiResponse = {
  tripName?: string;
  items?: TravelItem[];
  error?: string;
};

// Google ドライブのURLをWeb表示用に変換する関数
function getMediaUrl(url: string, type: 'image' | 'video' | 'audio') {
  if (!url.includes('drive.google.com')) return url;
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  const fileId = match[1];

  if (type === 'image') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  } else {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
}

async function getTravelData(): Promise<ApiResponse> {
  const url = process.env.NEXT_PUBLIC_GAS_API_URL;
  if (!url) return { error: 'Environment variable not set' };

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  } catch (err) {
    return { error: 'Failed to connect to GAS' };
  }
}

export default async function Page() {
  const data = await getTravelData();
  const logs = data.items || [];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-white selection:bg-zinc-700">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
             {data.tripName || "旅の記録"}
          </h1>
          <div className="h-1 w-12 bg-zinc-700 mx-auto mb-4"></div>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-sm">
            Digital Archive 2026
          </p>
        </header>

        <div className="flex flex-col gap-16">
          {logs.map((item, index) => (
            <article key={index} className="group">
              
              {/* 写真の表示 */}
              {item.type === 'image' && (
                <div className="w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                  <img 
                    src={getMediaUrl(item.content, 'image')} 
                    alt="Travel Photo" 
                    className="w-full h-auto block grayscale-[20%] hover:grayscale-0 transition-all duration-700" 
                    loading="lazy"
                  />
                </div>
              )}

              {/* 動画・音声の表示：縦動画に対応するために aspect-video を削除 */}
              {(item.type === 'video' || item.type === 'audio') && (
                <div className={`w-full bg-black border border-zinc-800 overflow-hidden shadow-2xl`}>
                  {item.type === 'video' ? (
                    <div className="relative w-full" style={{ height: '70vh', maxHeight: '1000px' }}>
                      <iframe
                        src={getMediaUrl(item.content, 'video')}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="autoplay"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="h-40 w-full">
                      <iframe
                        src={getMediaUrl(item.content, 'audio')}
                        className="w-full h-full"
                        allow="autoplay"
                      ></iframe>
                    </div>
                  )}
                </div>
              )}

              {/* テキスト・詳細エリア */}
              <div className="mt-6 px-1">
                {item.type === 'text' ? (
                  <div className="p-8 bg-zinc-900 border border-zinc-800 shadow-inner">
                    <p className="text-xl md:text-2xl leading-relaxed font-light text-zinc-200">
                      {item.content}
                    </p>
                  </div>
                ) : (
                  item.comment && (
                    <p className="text-2xl font-bold text-zinc-100 leading-tight mb-4 tracking-tight">
                      {item.comment}
                    </p>
                  )
                )}
                
                <footer className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
                  <time className="hover:text-zinc-400 transition-colors">
                    {new Date(item.timestamp).toLocaleString('ja-JP')}
                  </time>
                  <div className="flex-grow h-[1px] bg-zinc-900"></div>
                  <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5">
                    {item.type === 'audio' ? 'VOICE' : item.type}
                  </span>
                </footer>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-24 pb-12 text-center text-zinc-700 text-[10px] tracking-widest uppercase">
          &copy; 2026 {data.tripName || "Travel Log"} - All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}