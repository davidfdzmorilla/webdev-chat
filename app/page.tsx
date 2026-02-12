export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">WebDev Chat</h1>
        <p className="text-xl mb-8">Real-time messaging for developers</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/login"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
