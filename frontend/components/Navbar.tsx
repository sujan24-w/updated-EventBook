'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const navRef = useRef<HTMLDivElement>(null);
   const closeMenu = () => setMobileMenuOpen(false);
   useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

//login  user image like appereance
    const getAvatar= ()=>{
      if(user && user.role==="ADMIN") return "AD";
      if(!user || !user.role) return "";
       const avatar=user.name[0]+user.name[user.name.length-1];
      return  avatar.toUpperCase();
    }

  return (
    <header ref={navRef} className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Name */}
          <Link  onClick={closeMenu} href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform ">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
            <span className="font-extrabold text-xl text-slate-900 relative tracking-tight">
              Event<span className="text-blue-600">Book</span>
              <div className='h-2 w-2 bg-blue-500 rounded-full absolute  hover:w-full animate-bounce  '></div>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-sm text-slate-600">
            <Link href="/"  onClick={closeMenu}className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/events"  onClick={closeMenu}className="hover:text-blue-600 transition-colors">Browse Events</Link>
            {user && user.role==="USER" && (
              <Link href="/my-bookings" onClick={closeMenu}className="hover:text-blue-600 transition-colors">My Bookings</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin/dashboard" onClick={closeMenu} className="hover:text-blue-600 transition-colors">Admin Dashboard</Link>
            )}
          </nav>

          {/* Action Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div   title={user && user.role === "ADMIN" ? "Admin" : user.name}
                className='flex items-center justify-center h-8 w-8 rounded-full bg-blue-600/70 text-white font-semibold text-sm uppercase shadow-sm'>
                   { getAvatar()   }
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {user?.role === 'ADMIN' ? (
              <Link
                href="/admin/dashboard"
                onClick={closeMenu}
                className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg"
              >
               Admin  Dashboard
              </Link>
            ) : user ? (
              <div className='flex  gap-2 ' >
                 <div  
                className='flex items-center justify-center h-6 w-6 rounded-full bg-blue-600/70 text-white font-semibold text-sm uppercase shadow-sm'>
                   { getAvatar()   }
                </div>
              <Link
                href="/my-bookings"
                onClick={closeMenu}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition  max-[450px]:hidden"
                >
                Bookings
              </Link>
                </div>
            ) : null}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-blue-100 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link  onClick={closeMenu} href="/" className="block py-2 text-slate-700 font-medium">Home</Link>
          <Link  onClick={closeMenu} href="/events" className="block py-2 text-slate-700 font-medium ">Browse Events</Link>
          {user && user.role !== 'ADMIN' && (
            <Link onClick={closeMenu} href="/my-bookings" className="block py-2 text-slate-700 font-medium">My Bookings</Link>
          )}
          <div className="pt-2  border-slate-100 flex flex-col space-y-2">
            {user ? (
              <button onClick={() => {
                  logout();
                  closeMenu();
                }}className="w-full text-left py-2 text-red-600 font-medium  cursor-pointer">Log Out</button>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className="block py-2 text-center text-blue-600 font-semibold border border-blue-600 rounded-lg">Log In</Link>
                <Link href="/register"  onClick={closeMenu}className="block py-2 text-center text-white bg-blue-600 rounded-lg font-semibold">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

