"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

// --- 型定義 ---
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
  thumbnails: string[];
};

type ApiResponse = {
  tripId?: string;
  tripName?: string;
  items?: TravelItem[];
  albums?: Album[]; 
  error?: string;
};

const URL_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

function getMediaUrl(url: string, type: 'image' | 'video' | 'audio', size: 'small' | 'large' = 'large') {
  if (!url.includes('drive.google.com')) return url;
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  const fileId = match[1];
  if (type === 'image') {
    const sizeParam = size === 'small' ? 'h400' : 'w2000';
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sizeParam}`;
  }
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

export default function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = use(props.searchParams);
  const tripId = typeof searchParams.tripId === 'string' ? searchParams.tripId : undefined;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [items, setItems] = useState<TravelItem[]>([]);

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    const baseUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
    const url = tripId ? `${baseUrl}?tripId=${tripId}` : `${baseUrl}?mode=list`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      if (json.items) {
        setItems(json.items);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tripId]);

  // 削除処理
  const handleDelete = async (timestamp: string) => {
    if (!confirm("この投稿を削除しますか？")) return;
    const baseUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
    try {
      await fetch(`${baseUrl}?action=deleteContent&timestamp=${timestamp}`, { mode: 'no-cors' });
      // 成功したとみなしてローカルから消す（no-corsの場合は成否判定が難しいため）
      setItems(prev => prev.filter(item => item.timestamp !== timestamp));
      alert("削除リクエストを送信しました（反映まで時間がかかる場合があります）");
    } catch (e) {
      alert("エラーが発生しました");
    }
  };

  // ソート処理
  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin border-4 border-zinc-800 border-t-zinc-400 rounded-full"></div>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs animate-pulse">Loading Archives...</p>
        </div>
      </div>
    );
  }

  // --- まとめページ（一覧） ---
  if (!tripId || data?.albums) {
    const albums = data?.albums || [];
    return (
      <main className="min-h-screen p-8 bg-black text-white font-sans">
        <div className="max-w-4xl mx-auto mt-20">
          <header className="mb-20 text-center">
            <h1 className="text-5xl font-black tracking-tighter mb-4 italic">ANOTHER SKY</h1>
            <div className="h-1 w-12 bg-zinc-800 mx-auto mb-4"></div>
            <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs">Archives Index</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {albums.map((album) => (
              <Link key={album.id} href={`/?tripId=${album.id}`} className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-all shadow-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                   <div>
                    <h2 className="text-2xl font-bold italic truncate">{album.name}</h2>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{album.status === 'active' ? '● Recording' : 'Archive'}</span>
                  </div>
                  <span className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-2">→</span>
                </div>
                {album.thumbnails.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5 bg-zinc-800 h-48">
                    {album.thumbnails.map((url, i) => (
                      <div key={i} className="bg-zinc-950 overflow-hidden">
                        <img src={getMediaUrl(url, 'image', 'small')} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                    ))}
                  </div>
                ) : <div className="h-48 bg-zinc-950/30 flex items-center justify-center text-zinc-700 text-xs uppercase tracking-widest">No Photos</div>}
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --- 詳細ページ ---
  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-white selection:bg-zinc-700 font-sans">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-12 flex justify-between items-center">
          <Link href="/" className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] hover:text-white transition-colors">
            ← Index
          </Link>
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-3 py-1 border border-zinc-800 hover:text-white transition-all"
          >
            Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </nav>

        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic">{data?.tripName}</h1>
          <div className="h-1 w-12 bg-zinc-800 mx-auto mb-4"></div>
        </header>

        <div className="flex flex-col gap-20">
          {sortedItems.map((item, index) => {
            const isVertical = item.comment && (item.comment.includes('縦') || item.comment.includes('縦長'));
            return (
              <article key={item.timestamp} className="group">
                {item.type === 'image' && (
                  <div className="w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                    <img src={getMediaUrl(item.content, 'image')} className="w-full h-auto block grayscale-[10%] hover:grayscale-0 transition-all duration-700" />
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

                <div className="mt-8 px-1 relative">
                  {/* 削除ボタン */}
                  <button 
                    onClick={() => handleDelete(item.timestamp)}
                    className="absolute -top-4 right-0 text-[10px] text-zinc-700 hover:text-red-500 transition-colors bg-black px-2 py-1"
                  >
                    Delete
                  </button>

                  {item.type === 'text' ? (
                    <div className="p-8 bg-zinc-900 border border-zinc-800 shadow-inner"><LinkedText text={item.content} /></div>
                  ) : (
                    item.comment && <div className="mb-6"><LinkedText text={item.comment} className="text-2xl font-bold text-zinc-100 leading-tight tracking-tight break-words" /></div>
                  )}
                  <footer className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
                    <time>{new Date(item.timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
                    <span className="text-zinc-500 font-normal italic">by {item.author || "User"}</span>
                    <div className="flex-grow h-[1px] bg-zinc-900"></div>
                    <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5">{item.type}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}