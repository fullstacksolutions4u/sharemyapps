import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="ShareMyApps logo" className="h-5 w-5 object-contain" />
          <span className="font-semibold text-text">ShareMyApps</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">© {year} All rights reserved.</span>
        </div>

        {/* Mobile copyright */}
        <span className="sm:hidden">© {year} All rights reserved.</span>

        {/* Links */}
        <nav className="flex items-center gap-4">
          <Link
            to="/privacy-policy"
            className="hover:text-accent transition-colors duration-150 underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          <a
            href="mailto:sharemyappsportal@gmail.com"
            className="hover:text-accent transition-colors duration-150"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
