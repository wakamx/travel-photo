export async function getTripData(tripId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_GAS_API_URL}?tripId=${tripId}`, {
    cache: 'no-store' // 常に最新のデータを取得
  });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}