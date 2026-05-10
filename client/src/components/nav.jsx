import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, X, Workflow, Settings, ChevronDown, LayoutDashboard, Users, ShieldAlert
} from "lucide-react";
import { logoutUser } from "@/API/authApi";
import { useAuth } from "@/API/AuthContext";

function Nav() {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.companyRole === "ADMIN";
  const isSuperAdmin = user?.companyRole === "SUPER_ADMIN";
  const isUser = user?.companyRole === "USER";

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

  // Minimal GitHub/Jira style links
  const navLinkStyle = "px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors";
  const authButtonStyle = "px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md";

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="flex items-center justify-between px-6 h-12 max-w-full mx-auto">
        <Link to="/" className="flex items-center gap-2 group mr-6">
          <Workflow size={20} strokeWidth={2} className="text-gray-800" />
          <h1 className="text-sm font-semibold text-gray-900 tracking-tight">
            ProcessFlow
          </h1>
        </Link>

        {/* --- Hamburger --- */}
        <button
          className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* --- Desktop Navigation --- */}
        <div className="hidden md:flex items-center gap-1 w-full max-w-3xl">
          <Link className={navLinkStyle} to="/">Overview</Link>
          <Link className={navLinkStyle} to="/about">About</Link>
          <Link className={navLinkStyle} to="/features">Features</Link>
          <Link className={navLinkStyle} to="/demo">Demo Workspace</Link>

          {user && isUser && (
            <Link className={`${navLinkStyle} text-blue-700 bg-blue-50 border border-blue-200`} to="/workplace">
              My Workplace
            </Link>
          )}

          {user && (isAdmin || isSuperAdmin) && (
            <div className="relative group ml-1">
              <button className={`${navLinkStyle} flex items-center gap-1 cursor-pointer`}>
                Manage <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
              </button>

              <div className="absolute top-full left-0 pt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100">
                <div className="bg-white rounded-md shadow-lg border border-gray-200 py-1 flex flex-col">
                  <Link to="/admin/projects" className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link to="/admin/pending-users" className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                    <Users size={14} /> Pending Users
                  </Link>
                  {isSuperAdmin && (
                    <div className="mt-1 pt-1 border-t border-gray-100">
                      <Link to="/superadmin" className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50">
                        <ShieldAlert size={14} /> Super Admin
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- Desktop Auth Buttons --- */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {!user ? (
            <>
              <Link className={`${authButtonStyle} text-gray-600 hover:text-gray-900 hover:bg-gray-100`} to="/login">
                Sign in
              </Link>
              <Link className={`${authButtonStyle} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm`} to="/signup">
                Sign up
              </Link>
            </>
          ) : (
            <button onClick={handleLogout} className={`${authButtonStyle} text-red-600 border border-red-200 bg-white hover:bg-red-50 shadow-sm`}>
              Sign out
            </button>
          )}
        </div>
      </nav>

      {/* --- Mobile Menu --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="flex flex-col p-2 space-y-1">
            <Link className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" to="/" onClick={() => setIsOpen(false)}>Overview</Link>
            <Link className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" to="/about" onClick={() => setIsOpen(false)}>About</Link>
            <Link className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" to="/features" onClick={() => setIsOpen(false)}>Features</Link>

            {user && (isAdmin || isSuperAdmin) && (
              <div className="py-2 border-y border-gray-100 my-1">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Administration</div>
                <Link className="flex px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" to="/admin/projects" onClick={() => setIsOpen(false)}>Dashboard</Link>
                <Link className="flex px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" to="/admin/pending-users" onClick={() => setIsOpen(false)}>Pending Users</Link>
                {isSuperAdmin && (
                  <Link className="flex px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md" to="/superadmin" onClick={() => setIsOpen(false)}>Super Admin</Link>
                )}
              </div>
            )}

            {!user ? (
              <div className="flex gap-2 pt-2 border-t border-gray-100 px-2 mt-2">
                <Link className="flex-1 text-center py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium" to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                <Link className="flex-1 text-center py-2 text-sm text-white bg-gray-800 hover:bg-gray-900 rounded-md font-medium" to="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="w-full mt-2 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200">Sign Out</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Nav;