import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-row items-center justify-center gap-8 text-xs" style={{ color: '#4682B4' }}>
        <img src={logo} alt="ShareMyApps logo" className="h-5 w-5 object-contain shrink-0" />
        <span className="font-semibold">ShareMyApps</span>
        <span>© {year}</span>
        <span>·</span>
        <a
          href="mailto:hello@sharemyapps.in"
          className="hover:text-accent transition-colors duration-150"
        >
          hello@sharemyapps.in
        </a>
        <span>·</span>
        <Link to="/privacy-policy" className="hover:opacity-75 transition-opacity duration-150">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
