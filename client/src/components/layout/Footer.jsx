import { Link } from 'react-router-dom';
import ssLogo from '../../assets/ss_logo.png';

export default function Footer() {
  return (
    <footer className="bg-[#00A693] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs text-white">
        <div className="flex items-center gap-2">
          <span>Powered by SS HR Consultancy, India & Dubai</span>
          <img src={ssLogo} alt="SS HR Consultancy" className="h-9 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:hello@sharemyapps.in" className="hover:text-accent transition-colors duration-150">hello@sharemyapps.in</a>
          <span>·</span>
          <Link to="/privacy" className="hover:opacity-75 transition-opacity duration-150">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:opacity-75 transition-opacity duration-150">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
