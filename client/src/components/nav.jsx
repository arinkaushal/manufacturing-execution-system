import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Menu, X, Workflow, Settings, Box, 
  ChevronDown, LayoutDashboard, Users, ShieldAlert 
} from "lucide-react";
import { getSession, logoutUser } from "@/API/authApi";
import { useAuth } from "@/API/AuthContext";

function Nav() {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  const isAdmin = session?.companyRole === "ADMIN";
  const isSuperAdmin = session?.companyRole === "SUPER_ADMIN";
  const isUser = session?.companyRole === "USER";

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // -- STYLES --
  // 1. Standard Link Style (Reduced size from text-2xl to text-sm to fix wrapping)
  const navLinkStyle = "px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all duration-200";
  
  // 2. Button styles for Auth
  const authButtonStyle = "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg";

  return (
    // Outer container: Full width, sticky to top
    <div className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <nav className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto">
        
        {/* --- Logo --- */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative text-blue-600 group-hover:scale-105 transition-transform">
            <Workflow size={32} strokeWidth={1.5} />
            <Settings className="absolute -top-1 -right-1 animate-[spin_10s_linear_infinite] opacity-70" size={14} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            ProcessFlow
          </h1>
        </Link>

        {/* --- Hamburger (Mobile) --- */}
        <button
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* --- Desktop Navigation --- */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link className={navLinkStyle} to="/">Home</Link>
          <Link className={navLinkStyle} to="/about">About</Link>
          <Link className={navLinkStyle} to="/features">Features</Link>
          <Link className={navLinkStyle} to="/demo">Demo</Link>
          
          {session && isUser && (
            <Link className={`${navLinkStyle} text-blue-600 bg-blue-50/50`} to="/workplace">
              WorkPlace
            </Link>
          )}

          {/* --- ADMIN DROPDOWN (Floating Popup) --- */}
          {session && (isAdmin || isSuperAdmin) && (
            <div className="relative group">
              {/* Trigger Button */}
              <button className={`${navLinkStyle} flex items-center gap-1 cursor-pointer`}>
                Admin <ChevronDown size={14} />
              </button>

              {/* The Dropdown Panel */}
              <div className="absolute top-full right-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-1 flex flex-col">
                  
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Management</div>
                  
                  <Link to="/admin/projects" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  
                  <Link to="/admin/pending-users" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                    <Users size={16} /> Pending Users
                  </Link>

                  {isSuperAdmin && (
                    <Link to="/superadmin" className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg mt-1 border-t border-slate-100">
                      <ShieldAlert size={16} /> Super Admin
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <Link className={navLinkStyle} to="/contact">Contact</Link>
        </div>

        {/* --- Desktop Auth Buttons --- */}
        <div className="hidden md:flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
          {!user ? (
            <>
              <Link className={`${authButtonStyle} text-slate-600 hover:bg-slate-100`} to="/login">
                Login
              </Link>
              <Link className={`${authButtonStyle} bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200`} to="/signup">
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className={`${authButtonStyle} text-red-600 bg-red-50 hover:bg-red-100`}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* --- Mobile Menu --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col p-4 space-y-1">
            <Link className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg" to="/" onClick={() => setIsOpen(false)}>Home</Link>
            <Link className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg" to="/about" onClick={() => setIsOpen(false)}>About</Link>
            <Link className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg" to="/features" onClick={() => setIsOpen(false)}>Features</Link>
            
            {/* Mobile Admin Links (Shown directly in list) */}
            {session && (isAdmin || isSuperAdmin) && (
              <div className="py-2 space-y-1 border-y border-slate-100 my-2">
                <div className="px-4 text-xs font-bold text-slate-400 uppercase">Admin Controls</div>
                <Link className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" to="/admin/projects" onClick={() => setIsOpen(false)}>• Dashboard</Link>
                <Link className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" to="/admin/pending-users" onClick={() => setIsOpen(false)}>• Pending Users</Link>
                {isSuperAdmin && (
                  <Link className="block px-4 py-2 text-sm text-amber-600 font-medium" to="/superadmin" onClick={() => setIsOpen(false)}>• Super Admin</Link>
                )}
              </div>
            )}

            {!user ? (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <Link className="flex justify-center py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg" to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                <Link className="flex justify-center py-2 text-sm font-bold text-white bg-blue-600 rounded-lg" to="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
                <Link className="col-span-2 flex justify-center py-2 text-sm text-slate-500 hover:text-blue-600" to="/companyRegister" onClick={() => setIsOpen(false)}>Register Company</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="w-full mt-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg">Logout</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Nav;