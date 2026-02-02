// データの型定義
type TravelItem = {
  timestamp: string;
  type: 'text' | 'image' | 'video';
  content: string;
  comment: string;
};

type ApiResponse = {
  tripName?: string;
  items?: TravelItem[];
  error?: string;
  message?: string;
};

async function getTravelData(): Promise<ApiResponse> {
  const url = process.env.NEXT_PUBLIC_GAS_API_URL;
  if (!url) {
    return { error: 'Environment variable not set' };
  }

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

  if (data.error) {
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-xl font-bold">Error</h1>
        <p>{data.message || data.error}</p>
      </div>
    );
  }

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
          {logs.length > 0 ? (
            logs.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* メディア表示 (画像・動画) */}
                {item.type === 'image' && (
                  <img src={item.content} alt="Travel Photo" className="w-full h-auto" />
                )}
                {item.type === 'video' && (
                  <video src={item.content} controls className="w-full h-auto" />
                )}

                {/* テキスト・コメント表示 */}
                <div className="p-6">
                  {item.type === 'text' ? (
                    <p className="text-lg text-slate-800 leading-relaxed">{item.content}</p>
                  ) : (
                    item.comment && <p className="text-slate-700 italic">“ {item.comment} ”</p>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(item.timestamp).toLocaleString('ja-JP')}</span>
                    <span className="uppercase tracking-widest">{item.type}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">まだ思い出が記録されていません。<br/>LINEから写真を送ってみましょう！</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}