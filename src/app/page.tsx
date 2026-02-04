import Link from 'next/link';

// 型定義
type TravelItem = {
  timestamp: string;
  author: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string; 
  comment: string;
};

type Album = {
  id: string;
  name: string;
  status: string;
};

type ApiResponse = {
  tripId?: string;
  tripName?: string;
  items?: TravelItem[];
  albums?: Album[]; // 一覧用
  error?: string;
};

const URL_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

function getMediaUrl(url: string, type: 'image' | 'video' | 'audio') {
  if (!url.includes('drive.google.com')) return url;
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  const fileId = match[1];
  if (type === 'image') return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function LinkedText({ text, className }: { text: string; className?: string }) {
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    if (match[1] && match[2]) {
      parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-white transition-colors">{match[1]}</a>);
    } else if (match[3]) {
      parts.push(<a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-white transition-colors">{match[3]}</a>);
    }
    lastIndex = URL_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return <p className={className || "text-xl md:text-2xl leading-relaxed font-light text-zinc-200 break-words"}>{parts.length > 0 ? parts : text}</p>;
}

// データ取得用関数 ( tripId があれば詳細、なければ一覧 )
async function getTravelData(tripId?: string): Promise<ApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
  if (!baseUrl) return { error: 'Environment variable not set' };
  
  const url = tripId ? `${baseUrl}?tripId=${tripId}` : `${baseUrl}?mode=list`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  } catch (err) {
    return { error: 'Failed to connect to GAS' };
  }
}

export default async function Page({ searchParams }: { searchParams: { tripId?: string } }) {
  const tripId = searchParams.tripId;
  const data = await getTravelData(tripId);

  // --- まとめページ（一覧）の表示 ---
  if (!tripId || data.albums) {
    const albums = data.albums || [];
    return (
      <main className="min-h-screen p-8 bg-black text-white font-sans">
        <div className="max-w-3xl mx-auto mt-20">
          <header className="mb-20 text-center">
            <h1 className="text-5xl font-black tracking-tighter mb-4 italic">ANOTHER SKY</h1>
            <div className="h-1 w-12 bg-zinc-800 mx-auto mb-4"></div>
            <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs">Archives Index</p>
          </header>

          <div className="flex flex-col gap-4">
            {albums.map((album) => (
              <Link 
                key={album.id} 
                href={`/?tripId=${album.id}`}
                className="group flex items-center justify-between p-8 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-all shadow-xl"
              >
                <div>
                  <h2 className="text-2xl font-bold group-hover:text-zinc-200 transition-colors italic">{album.name}</h2>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{album.status === 'active' ? '● Recording' : 'Archive'}</span>
                </div>
                <span className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-2">→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --- 詳細ページの表示 ---
  const logs = data.items || [];
  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-white selection:bg-zinc-700 font-sans">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-12">
          <Link href="/" className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] hover:text-white transition-colors">
            ← Back to Index
          </Link>
        </nav>

        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic">{data.tripName}</h1>
          <div className="h-1 w-12 bg-zinc-800 mx-auto mb-4"></div>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs">Digital Archive 2026</p>
        </header>

        <div className="flex flex-col gap-20">
          {logs.map((item, index) => {
            const isVertical = item.comment && (item.comment.includes('縦') || item.comment.includes('縦長'));
            return (
              <article key={index} className="group">
                {item.type === 'image' && (
                  <div className="w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <img src={getMediaUrl(item.content, 'image')} alt="Photo" className="w-full h-auto block grayscale-[10%] hover:grayscale-0 transition-all duration-700" loading="lazy" />
                  </div>
                )}
                {item.type === 'video' && (
                  <div className={`w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl relative ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
                    <iframe src={getMediaUrl(item.content, 'video')} className="absolute top-0 left-0 w-full h-full" allowFullScreen></iframe>
                  </div>
                )}
                {item.type === 'audio' && (
                  <div className="w-full h-40 bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <iframe src={getMediaUrl(item.content, 'audio')} className="w-full h-full"></iframe>
                  </div>
                )}
                <div className="mt-8 px-1">
                  {item.type === 'text' ? (
                    <div className="p-8 bg-zinc-900 border border-zinc-800 shadow-inner"><LinkedText text={item.content} /></div>
                  ) : (
                    item.comment && <div className="mb-6"><LinkedText text={item.comment} className="text-2xl font-bold text-zinc-100 leading-tight tracking-tight break-words" /></div>
                  )}
                  <footer className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
                    <time>{new Date(item.timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
                    <span className="text-zinc-500 font-normal normal-case tracking-widest italic">by {item.author || "User"}</span>
                    <div className="flex-grow h-[1px] bg-zinc-900"></div>
                    <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5">{item.type === 'audio' ? 'VOICE' : item.type}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
        <footer className="mt-32 pb-16 text-center text-zinc-800 text-[10px] tracking-[0.5em] uppercase">© 2026 Archive - All Rights Reserved.</footer>
      </div>
    </main>
  );
}