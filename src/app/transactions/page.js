"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api, { endpoints } from "@/lib/axios";

export default function Transactions() {
  const { user, authenticated, loading } = useAuth();
  const router = useRouter();
  const [quizHistory, setQuizHistory] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [lossAmount, setLossAmount] = useState(0);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/");
    }
  }, [authenticated, loading, router]);

  useEffect(() => {
    if (authenticated && user) {
      fetchTransactions();
    }
  }, [authenticated, user]);

  useEffect(() => {
    // Apply filters when filter changes
    applyFilters();
  }, [filter, quizHistory]);

  // Calculate win and loss amounts like mobile app
  const calculateWinLossAmount = (history = []) => {
    let winAmount = 0;
    let lossAmount = 0;

    history.forEach((item) => {
      if (item.won === true) {
        winAmount += item.winCoins || 0;
      } else {
        lossAmount += item.prize || 0;
      }
    });

    return {
      winAmount,
      lossAmount,
    };
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      setError("");

      // Fetch quiz history exactly like mobile app
      const response = await api.get(endpoints.quizHistory);
      const history = response.data.history || [];

      setQuizHistory(history);

      // Calculate win/loss amounts
      const {
        winAmount: calculatedWinAmount,
        lossAmount: calculatedLossAmount,
      } = calculateWinLossAmount(history);
      setWinAmount(calculatedWinAmount);
      setLossAmount(calculatedLossAmount);

      // Transform for display
      const transformedTransactions = history
        .filter((quiz) => quiz && (quiz._id || quiz.id))
        .map((quiz) => ({
          id: quiz._id || quiz.id,
          type: quiz.won ? "quiz_win" : "quiz_loss",
          amount: quiz.won ? quiz.winCoins || 0 : quiz.prize || 0,
          status: "completed",
          created_at:
            quiz.attemptedAt || quiz.createdAt || new Date().toISOString(),
          metadata: {
            quiz_name: quiz.quizName || quiz.name || "Quiz",
            won: quiz.won,
          },
        }));

      setFilteredTransactions(transformedTransactions);
    } catch (err) {
      console.error("Failed to fetch quiz history:", err);
      setError("Failed to load quiz history");
      setQuizHistory([]);
      setFilteredTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    if (!quizHistory) return;

    let filtered = quizHistory.filter((quiz) => quiz && (quiz._id || quiz.id));

    // Filter by result type
    if (filter === "quiz_win") {
      filtered = filtered.filter((quiz) => quiz.won === true);
    } else if (filter === "quiz_loss") {
      filtered = filtered.filter((quiz) => quiz.won === false);
    }

    // Transform for display
    const transformedTransactions = filtered.map((quiz) => ({
      id: quiz._id || quiz.id,
      type: quiz.won ? "quiz_win" : "quiz_loss",
      amount: quiz.won ? quiz.winCoins || 0 : quiz.prize || 0,
      status: "completed",
      created_at:
        quiz.attemptedAt || quiz.createdAt || new Date().toISOString(),
      metadata: {
        quiz_name: quiz.quizName || quiz.name || "Quiz",
        won: quiz.won,
      },
    }));

    // Sort by date (newest first)
    transformedTransactions.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setFilteredTransactions(transformedTransactions);
  }, [quizHistory, filter]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case "recharge":
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
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
          </div>
        );
      case "withdrawal":
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
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
        );
      case "quiz_win":
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3l14 9-14 9V3z"
              />
            </svg>
          </div>
        );
      case "quiz_loss":
        return (
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
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
          </div>
        );
    }
  };

  const getTransactionTitle = (transaction) => {
    switch (transaction.type) {
      case "recharge":
        return "Coin Recharge";
      case "withdrawal":
        return "Withdrawal Request";
      case "quiz_win":
        return `Quiz Win - ${transaction.metadata?.quiz_name || "Quiz"}`;
      case "quiz_loss":
        return `Quiz Loss - ${transaction.metadata?.quiz_name || "Quiz"}`;
      case "connection_fee":
        return "Connection Fee";
      default:
        return "Transaction";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

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

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Duo Balance - matching brand language */}
      <Card>
        <Card.Content>
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-duo-text-primary">
                Duo Balance
              </h2>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-semibold">₹</span>
                <span className="text-2xl font-light text-black">
                  {user.coins || "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Total Wins and Losses */}
          <div className="flex gap-6">
            <div>
              <h3 className="text-base font-medium text-duo-text-primary mb-1">
                Total wins
              </h3>
              <div className="flex items-center">
                <span className="text-xl">₹</span>
                <span className="text-xl ml-1">{winAmount || "0"}</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-medium text-duo-text-primary mb-1">
                Total losses
              </h3>
              <div className="flex items-center">
                <span className="text-xl">₹</span>
                <span className="text-xl ml-1">{lossAmount || "0"}</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Transactions Section */}
      <Card>
        <Card.Content>
          <div className="border-b border-gray-200 pb-3 mb-6">
            <h2 className="text-base font-normal text-duo-text-primary">
              Transactions
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {/* Filter by Result */}
            <div>
              <label className="block text-sm font-medium text-duo-text-primary mb-2">
                Filter by Result
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-duo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-duo-primary/20"
              >
                <option value="all">All Quizzes</option>
                <option value="quiz_win">Wins Only</option>
                <option value="quiz_loss">Losses Only</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="medium" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-duo-bg-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-duo-primary"
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
              </div>
              <h3 className="text-lg font-medium text-duo-text-primary mb-2">
                No quizzes found
              </h3>
              <p className="text-duo-text-secondary">
                {filter === "all"
                  ? "You haven't attempted any quizzes yet."
                  : filter === "quiz_win"
                  ? "No winning quizzes found."
                  : "No losing quizzes found."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions
                .map((transaction, index) => {
                  // Safety check for transaction data
                  if (!transaction || !transaction.id) {
                    return null;
                  }

                  return (
                    <div
                      key={transaction.id || index}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Left: Quiz Name and Date */}
                      <div className="flex-1 max-w-[40%]">
                        <h4 className="font-medium text-duo-text-primary text-sm">
                          {transaction.metadata?.quiz_name || "Quiz"}
                        </h4>
                        <p className="text-xs text-duo-text-secondary font-light">
                          {(() => {
                            try {
                              return transaction.created_at.slice(0, 10);
                            } catch (dateError) {
                              return "Date unavailable";
                            }
                          })()}
                        </p>
                      </div>

                      {/* Center: Result */}
                      <div className="flex-1 text-center">
                        <span className="text-duo-text-secondary font-light">
                          {transaction.metadata?.won ? "Winning" : "Lost"}
                        </span>
                      </div>

                      {/* Right: Amount with Rupee Symbol */}
                      <div className="flex items-center gap-1">
                        <span className="text-lg">₹</span>
                        <span className="text-sm text-duo-text-primary font-light">
                          {transaction.amount || "0"}
                        </span>
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
