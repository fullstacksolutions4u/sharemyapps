import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-[#E8734A] mb-4">404</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Page not found</h1>
        <p className="text-[#6B7280] text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#E8734A] hover:bg-[#D4612F] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </div>
  );
}
