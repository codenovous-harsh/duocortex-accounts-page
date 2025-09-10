"use client";

import React from "react";
import Header from "./Header";

const Layout = ({
  children,
  title = "DuoCortex Accounts",
  showBack = false,
  onBack,
  className = "",
  showHeader = true,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {showHeader && (
        <Header title={title} showBack={showBack} onBack={onBack} />
      )}

      <main
        className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${className}`}
      >
        {children}
      </main>

      {/* <footer className="bg-white border-t border-duo-border mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-duo-text-secondary">
            <p className="text-sm">© 2024 DuoCortex. All rights reserved.</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Secure & Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-duo-primary rounded-full"></div>
                <span className="text-xs">PCI DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Layout;
