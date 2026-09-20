import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import ssLogo from '../../assets/ss_logo.png';

export default function Footer() {
  return (
    <footer className="bg-[#00A693] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-row flex-wrap items-center justify-center gap-4 text-xs text-white">
        <a href="https://www.sshrconsultancy.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group">
          <img src={ssLogo} alt="SS HR Consultancy" className="h-9 w-auto object-contain" />
          <span>Powered by <span className="text-[#FFFF00]">SS HR Consultancy</span>, India & Dubai</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity -mt-0.5" />
        </a>
        
        <span className="hidden sm:inline">·</span>
        
        <a href="mailto:hello@sharemyapps.in" className="hover:text-accent transition-colors duration-150">hello@sharemyapps.in</a>
        <span>·</span>
        <Link to="/privacy" className="hover:opacity-75 transition-opacity duration-150">Privacy Policy</Link>
        <span>·</span>
        <Link to="/terms" className="hover:opacity-75 transition-opacity duration-150">Terms of Service</Link>
      </div>
    </footer>
  );
}
