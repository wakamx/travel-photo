// データの型定義
type TravelItem = {
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio'; // audioを追加
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
  
  // URLまたはIDからファイルIDを抽出
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  const fileId = match[1];

  if (type === 'image') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  } else if (type === 'video') {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } else {
    // 音声用：iPhoneのSafariで最も安定して再生される形式に変更
    return `https://docs.google.com/uc?id=${fileId}`;
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
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tighter">
             {data.tripName || "旅の記録"}
          </h1>
          <p className="text-slate-500 mt-3 font-medium">Memory Feed in 2026</p>
        </header>

        <div className="flex flex-col gap-12">
          {logs.map((item, index) => (
            <article key={index} className="group overflow-hidden">
              
              {/* 写真の表示：rounded-2xlを削除して角を直角に保持 */}
              {item.type === 'image' && (
                <div className="w-full bg-white shadow-md overflow-hidden border border-slate-100">
                  <img 
                    src={getMediaUrl(item.content, 'image')} 
                    alt="Travel Photo" 
                    className="w-full h-auto block" // h-autoで比率を維持、w-fullで横幅最大
                    loading="lazy"
                  />
                </div>
              )}

              {/* 動画の表示：rounded-2xlを削除 */}
              {item.type === 'video' && (
                <div className="w-full aspect-video bg-black shadow-md overflow-hidden border border-slate-100">
                  <iframe
                    src={getMediaUrl(item.content, 'video')}
                    className="w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* 音声の表示：新規追加 */}
              {item.type === 'audio' && (
                <div className="w-full p-6 bg-white shadow-md border border-slate-100 flex flex-col items-center gap-4">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Voice Message</p>
                  <audio controls src={getMediaUrl(item.content, 'audio')} className="w-full max-w-md">
                    ブラウザが音声再生に対応していません。
                  </audio>
                </div>
              )}

              {/* テキスト・詳細エリア：rounded-2xlを削除 */}
              <div className="mt-4 px-2">
                {item.type === 'text' ? (
                  <div className="p-6 bg-white shadow-sm border border-slate-200">
                    <p className="text-lg leading-relaxed">{item.content}</p>
                  </div>
                ) : (
                  item.comment && (
                    <p className="text-xl font-medium text-slate-700 leading-snug">
                      {item.comment}
                    </p>
                  )
                )}
                
                <footer className="mt-3 flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <time>{new Date(item.timestamp).toLocaleString('ja-JP')}</time>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{item.type}</span>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}