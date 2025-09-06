export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-3xl items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-4">pairkuji</h1>
        <p className="text-lg mb-8">ダブルス練習試合の組み合わせ管理PWA</p>
        <a
          href="/members"
          className="inline-block rounded bg-blue-600 text-white px-5 py-3 hover:bg-blue-700"
        >
          選手登録へ
        </a>
      </div>
    </main>
  );
}
