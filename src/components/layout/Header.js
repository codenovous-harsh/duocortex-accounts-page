"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Header = ({ title, showBack = false, onBack }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-duo-border">
      <div className="max-w-4xl px-4 py-4 mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 transition-colors border rounded-lg border-duo-secondary text-duo-secondary hover:bg-duo-bg-purple"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-duo-primary">
                {title}
              </h1>
              {user && (
                <p className="text-sm text-duo-text-secondary">
                  Welcome, {user.name}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-duo-text-primary">
                    Duo Balance
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-semibold text-duo-primary">
                      ₹{user.coins || 0}
                    </span>
                    <span className="text-sm text-duo-text-secondary">
                      coins
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-duo-bg-purple focus:outline-none focus:ring-2 focus:ring-duo-primary/20"
                  aria-label="User menu"
                >
                  <span className="font-semibold text-duo-primary">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </button>
              </div>
            )}
            {menuOpen && (
              <div className="absolute right-0 z-20 w-56 p-2 bg-white border rounded-lg shadow-xl top-12 border-duo-border">
                <div className="px-3 py-2 text-xs text-duo-text-secondary">
                  Signed in as {user?.email || user?.name}
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    window.location.href = "/login";
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
