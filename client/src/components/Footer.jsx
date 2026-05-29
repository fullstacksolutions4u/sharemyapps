import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E1DA] bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <span className="w-6 h-6 rounded-md bg-[#E8734A] flex items-center justify-center text-white text-xs font-bold">F</span>
          FindMyApp
        </Link>
        <p className="text-xs text-[#6B7280]">
          A place for developers to share what they've built.
        </p>
        <div className="flex items-center gap-5 text-xs text-[#6B7280]">
          <Link to="/explore" className="hover:text-[#1A1A1A] transition-colors">Explore</Link>
          <Link to="/register" className="hover:text-[#1A1A1A] transition-colors">List a project</Link>
        </div>
      </div>
    </footer>
  );
}
