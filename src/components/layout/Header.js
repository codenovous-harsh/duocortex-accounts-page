"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const Header = ({ title, showBack = false, onBack }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-duo-border sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg border border-duo-secondary text-duo-secondary hover:bg-duo-bg-purple transition-colors"
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

          <div className="flex items-center space-x-4">
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
                <div className="w-10 h-10 bg-duo-bg-purple rounded-full flex items-center justify-center">
                  <span className="text-duo-primary font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
