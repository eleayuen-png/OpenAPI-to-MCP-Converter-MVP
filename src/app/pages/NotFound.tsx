import { Link } from 'react-router';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h1 className="text-6xl mb-4">404</h1>
          <h2 className="text-2xl mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
