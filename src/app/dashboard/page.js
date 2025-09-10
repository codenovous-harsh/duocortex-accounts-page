"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Layout from "@/components/layout/Layout";

export default function Dashboard() {
  const { user, authenticated, loading, refreshUser } = useAuth();
  const router = useRouter();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (!loading && !authenticated) {
      // Check if we're in the middle of processing authentication
      const isProcessingAuth = sessionStorage.getItem("processingAuth");
      if (isProcessingAuth) {
        return; // Don't redirect while processing auth
      }

      // Check if we have a stored token (might be in process of authentication)
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) {
        router.push("/");
      }
    }
  }, [authenticated, loading, router]);

  useEffect(() => {
    // Refresh user data only once when dashboard loads to get latest coins
    if (authenticated && user && refreshUser && !hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshUser();
    }
  }, [authenticated, user, refreshUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!authenticated || !user) {
    return null;
  }

  const quickActions = [
    {
      title: "Add Coins",
      description: "Recharge your DuoCortex wallet",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      action: () => router.push("/wallet"),
      color: "bg-green-500",
    },
    {
      title: "Withdraw Earnings",
      description: "Cash out your available coins",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      action: () => router.push("/withdraw"),
      color: "bg-blue-500",
    },
    {
      title: "Quiz History",
      description: "View your quiz wins and losses",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      action: () => router.push("/transactions"),
      color: "bg-purple-500",
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Hero */}
        <div className="overflow-hidden shadow-lg rounded-2xl">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-white/90">
                  Manage your DuoCortex coins and transactions
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Duo Balance</p>
                <p className="text-3xl font-extrabold sm:text-4xl">
                  ₹{user.coins || 0}
                </p>
                <p className="text-sm text-white/80">coins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid gap-4 md:grid-cols-2 sm:gap-6">
          <Card>
            <Card.Header>
              <Card.Title>Total Coins</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-duo-bg-purple">
                  <svg
                    className="w-6 h-6 text-duo-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-duo-text-primary">
                    ₹{user.coins || 0}
                  </p>
                  <p className="text-sm text-duo-text-secondary">
                    Available Duo Balance
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Available for Withdrawal</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-duo-text-primary">
                    ₹{user.availableCoins || 0}
                  </p>
                  <p className="text-sm text-duo-text-secondary">
                    Ready to withdraw (Min: ₹100)
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-4 text-left transition-all duration-200 bg-white border border-duo-border rounded-xl hover:border-duo-primary hover:shadow-md group"
                >
                  <div
                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-200`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="mb-1 font-semibold text-duo-text-primary">
                    {action.title}
                  </h3>
                  <p className="text-sm text-duo-text-secondary">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Security Notice */}
        <Card className="border-l-4 border-l-duo-primary">
          <Card.Content>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 mt-1 text-duo-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-duo-text-primary">
                  Secure & Encrypted
                </h4>
                <p className="mt-1 text-sm text-duo-text-secondary">
                  All transactions are secured with bank-level encryption. Your
                  financial data is protected with industry-standard security
                  measures.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
}
