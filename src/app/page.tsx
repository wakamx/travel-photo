// データの型定義
type TravelItem = {
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string; 
  comment: string;
};

type ApiResponse = {
  tripName?: string;
  items?: TravelItem[];
  error?: string;
};

// メディアURL変換関数
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

/**
 * テキスト内のURLや[名前](URL)形式を検知してリンク化し、
 * プレビューカードを生成するコンポーネント
 */
function LinkedText({ text, className }: { text: string; className?: string }) {
  // [名前](URL) 形式、または通常の URL を検知する正規表現
  const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  const detectedUrls: string[] = [];

  // テキストをパースしてリンク化
  while ((match = combinedRegex.exec(text)) !== null) {
    // マッチ前の普通のテキストを追加
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // [表示名](URL) の形式が見つかった場合
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-white transition-colors">
          {match[1]}
        </a>
      );
      detectedUrls.push(match[2]);
    } else if (match[3]) {
      // 通常の URL が見つかった場合
      parts.push(
        <a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-white transition-colors">
          {match[3]}
        </a>
      );
      detectedUrls.push(match[3]);
    }
    lastIndex = combinedRegex.lastIndex;
  }

  // 残りのテキストを追加
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <div className="space-y-6">
      <p className={className || "text-xl md:text-2xl leading-relaxed font-light text-zinc-200 break-words"}>
        {parts.length > 0 ? parts : text}
      </p>
      
      {/* リンクプレビューカード（URLが含まれる場合） */}
      {detectedUrls.length > 0 && detectedUrls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" 
           className="flex flex-col md:flex-row bg-zinc-950 border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors group/card shadow-xl">
          <div className="w-full md:w-32 h-32 md:h-auto bg-zinc-900 flex items-center justify-center p-4">
            <img 
              src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`}
              alt="Site icon"
              className="w-12 h-12 grayscale group-hover/card:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="p-4 flex flex-col justify-center overflow-hidden">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">External Link</span>
            <span className="text-sm font-bold text-zinc-300 truncate">{new URL(url).hostname}</span>
            <span className="text-xs text-zinc-500 truncate">{url}</span>
          </div>
        </a>
      ))}
    </div>
  );
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
            const isVertical = item.comment && (item.comment.includes('縦') || item.comment.includes('縦長'));

            return (
              <article key={index} className="group">
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

                {item.type === 'video' && (
                  <div className={`w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl relative
                    ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
                    <iframe
                      src={getMediaUrl(item.content, 'video')}
                      className="absolute top-0 left-0 w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                {item.type === 'audio' && (
                  <div className="w-full h-40 bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <iframe
                      src={getMediaUrl(item.content, 'audio')}
                      className="w-full h-full"
                    ></iframe>
                  </div>
                )}

                <div className="mt-8 px-1">
                  {item.type === 'text' ? (
                    <div className="p-8 bg-zinc-900 border border-zinc-800 shadow-inner">
                      <LinkedText text={item.content} />
                    </div>
                  ) : (
                    item.comment && (
                      <div className="mb-6">
                        <LinkedText 
                          text={item.comment} 
                          className="text-2xl font-bold text-zinc-100 leading-tight tracking-tight break-words"
                        />
                      </div>
                    )
                  )}
                  
                  <footer className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
                    <time>{new Date(item.timestamp).toLocaleString('ja-JP')}</time>
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