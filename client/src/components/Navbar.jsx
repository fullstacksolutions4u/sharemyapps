import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setDropOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E1DA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-[#1A1A1A] text-lg tracking-tight">
          <span className="w-7 h-7 rounded-lg bg-[#E8734A] flex items-center justify-center text-white text-sm font-bold">F</span>
          FindMyApp
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/explore" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Explore</Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#E8734A] transition-colors"
              >
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  : <span className="w-7 h-7 rounded-full bg-[#E8734A] text-white text-xs flex items-center justify-center font-medium">{user.name[0].toUpperCase()}</span>
                }
                <span>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E1DA] rounded-xl shadow-lg py-1">
                  <Link to="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FAF9F6]">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link to="/dashboard/add" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FAF9F6]">
                    <Plus size={14} /> Add Project
                  </Link>
                  <hr className="my-1 border-[#E5E1DA]" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[#FAF9F6]">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm bg-[#E8734A] hover:bg-[#D4612F] text-white px-4 py-2 rounded-lg transition-colors font-medium">
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#6B7280]" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E1DA] px-4 py-4 space-y-3">
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280] hover:text-[#1A1A1A]">Explore</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-[#1A1A1A]">Dashboard</Link>
              <Link to="/dashboard/add" onClick={() => setMenuOpen(false)} className="block text-sm text-[#1A1A1A]">Add Project</Link>
              <button onClick={handleLogout} className="block text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280]">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-sm bg-[#E8734A] text-white px-4 py-2 rounded-lg text-center">Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
