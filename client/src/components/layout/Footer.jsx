import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#00A693] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-row items-center justify-center gap-8 text-xs text-white">
        <img src={logo} alt="ShareMyApps logo" className="h-5 w-5 object-contain shrink-0 brightness-0 invert" />
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
