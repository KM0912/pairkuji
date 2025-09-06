import { NewSessionForm } from '../components/NewSessionForm';
import { SessionList } from '../components/SessionList';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">pairkuji</h1>
          <p className="text-xl text-gray-600">
            ダブルス練習試合の組み合わせ管理
          </p>
          <p className="text-gray-500 mt-2">
            公平な休憩時間で楽しい練習を
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* New Session Form */}
          <div className="flex justify-center lg:justify-end">
            <NewSessionForm />
          </div>

          {/* Session List */}
          <div className="lg:max-w-2xl">
            <SessionList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>&copy; 2024 pairkuji. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}