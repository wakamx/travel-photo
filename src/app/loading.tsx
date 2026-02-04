// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {/* シンプルなスピナー */}
        <div className="h-12 w-12 animate-spin border-4 border-zinc-800 border-t-zinc-400 rounded-full"></div>
        {/* 点滅するテキスト */}
        <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs animate-pulse">
          Loading Archives...
        </p>
      </div>
    </div>
  );
}