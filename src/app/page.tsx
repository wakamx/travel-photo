// データの型定義
type TravelItem = {
  timestamp: string;
  type: 'text' | 'image' | 'video';
  content: string; // Google ドライブのURL
  comment: string;
};

type ApiResponse = {
  tripName?: string;
  items?: TravelItem[];
  error?: string;
};

// Google ドライブのURLをWeb表示用に変換する関数
function getMediaUrl(url: string, type: 'image' | 'video') {
  if (!url.includes('drive.google.com')) return url;
  
  // URLからファイルID（id=xxxx）を抽出
  const match = url.match(/[?&]id=([^&]+)/);
  if (!match) return url;
  const fileId = match[1];

  if (type === 'image') {
    // 画像用：より軽量で確実なサムネイル用エンドポイントを使用（サイズ指定可能）
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  } else {
    // 動画用：標準のビデオタグではなくプレビュー用URLを返す
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
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
             耀くんとの {data.tripName || "旅の記録"} 🚢
          </h1>
          <p className="text-slate-500 mt-2">Special Moments in 2026</p>
        </header>

        <div className="space-y-8">
          {logs.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* 写真の表示 */}
              {item.type === 'image' && (
                <div className="aspect-video w-full bg-slate-100 relative">
                  <img 
                    src={getMediaUrl(item.content, 'image')} 
                    alt="Travel Photo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 動画の表示（iframeを使用） */}
              {item.type === 'video' && (
                <div className="aspect-video w-full">
                  <iframe
                    src={getMediaUrl(item.content, 'video')}
                    className="w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div className="p-6">
                {item.type === 'text' ? (
                  <p className="text-lg text-slate-800 leading-relaxed">{item.content}</p>
                ) : (
                  item.comment && <p className="text-slate-700 italic">“ {item.comment} ”</p>
                )}
                
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t pt-4">
                  <span>{new Date(item.timestamp).toLocaleString('ja-JP')}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}