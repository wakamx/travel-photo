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
    <main className="min-h-screen p-4 md:p-8 bg-black text-white selection:bg-zinc-700 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
             {data.tripName || "旅の記録"}
          </h1>
          <div className="h-1 w-12 bg-zinc-800 mx-auto mb-4"></div>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs">
            Digital Archive 2026
          </p>
        </header>

        <div className="flex flex-col gap-20">
          {logs.map((item, index) => {
            // コメントに「縦」が含まれているかチェック
            const isVertical = item.comment && (item.comment.includes('縦') || item.comment.includes('縦長'));

            return (
              <article key={index} className="group">
                {/* 写真表示 */}
                {item.type === 'image' && (
                  <div className="w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <img 
                      src={getMediaUrl(item.content, 'image')} 
                      alt="Travel Photo" 
                      className="w-full h-auto block grayscale-[10%] hover:grayscale-0 transition-all duration-700" 
                      loading="lazy"
                    />
                  </div>
                )}

                {/* 動画表示：比率固定ロジック */}
                {item.type === 'video' && (
                  <div className={`w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl relative
                    ${isVertical ? 'aspect-[3/4]' : 'aspect-video'}`}>
                    <iframe
                      src={getMediaUrl(item.content, 'video')}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                {/* 音声表示 */}
                {item.type === 'audio' && (
                  <div className="w-full h-40 bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <iframe
                      src={getMediaUrl(item.content, 'audio')}
                      className="w-full h-full"
                      allow="autoplay"
                    ></iframe>
                  </div>
                )}

                {/* テキスト・詳細エリア */}
                <div className="mt-8 px-1">
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
                  
                  <footer className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
                    <time className="hover:text-zinc-400 transition-colors">
                      {new Date(item.timestamp).toLocaleString('ja-JP')}
                    </time>
                    <div className="flex-grow h-[1px] bg-zinc-900"></div>
                    <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5">
                      {item.type === 'audio' ? 'VOICE' : item.type}
                    </span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="mt-32 pb-16 text-center text-zinc-800 text-[10px] tracking-[0.5em] uppercase">
          &copy; 2026 Archive - All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}