// データの型定義（耀くんとの思い出データ）
type TravelLog = {
  id: number;
  title: string;
  date: string;
};

async function getTravelLogs(): Promise<TravelLog[]> {
  const url = process.env.NEXT_PUBLIC_GAS_API_URL;
  
  if (!url) return [];

  // GASからデータを取得（キャッシュさせない設定）
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    throw new Error('データの取得に失敗しました');
  }

  return res.json();
}

export default async function Page() {
  const logs = await getTravelLogs();

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          耀くんとの旅行記 🚢
        </h1>

        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-blue-600 font-medium">{log.date}</p>
                <h2 className="text-xl font-semibold text-slate-700">{log.title}</h2>
              </div>
            ))
          ) : (
            <p className="text-slate-500">データがまだありません。</p>
          )}
        </div>
      </div>
    </main>
  );
}