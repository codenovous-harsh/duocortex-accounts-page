"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  createPaymentSession,
  initiatePayment,
  verifyPayment,
} from "@/lib/cashfree";
import { Suspense } from "react";

export default function Wallet() {
  const { user, authenticated, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/");
    }
  }, [authenticated, loading, router]);

  const quickAmounts = [20, 50, 100, 200, 500];

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
    setError("");
  };

  const validateAmount = (value) => {
    const numAmount = parseFloat(value);
    if (isNaN(numAmount) || numAmount < 1) {
      return "Minimum amount is ₹1";
    }
    if (numAmount > 10000) {
      return "Maximum amount is ₹10,000";
    }
    return "";
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    const validationError = validateAmount(value);
    setError(validationError);
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      setSuccess("");

      const validationError = validateAmount(amount);
      if (validationError) {
        setError(validationError);
        return;
      }

      const orderData = {
        amount: parseFloat(amount),
        customer_id: user.id || user._id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || "N/A",
      };

      // Create payment session
      const sessionData = await createPaymentSession(orderData);

      if (!sessionData.payment_session_id) {
        throw new Error("Failed to create payment session");
      }

      // Initiate payment - this will redirect to payment gateway
      await initiatePayment(sessionData.payment_session_id, {
        onFailure: (data) => {
          console.error("Payment failed:", data);
          setError("Payment failed. Please try again.");
        },
      });

      // Note: After successful payment, user will be redirected to /payment-status page
    } catch (err) {
      console.error("Payment error:", err);
      // Show modal ONLY for Cashfree phone invalid error
      if (err?.code === "customer_details.customer_phone_invalid") {
        setShowProfileModal(true);
        setError("");
      } else {
        setError(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Add Coins">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (!authenticated || !user) {
    return null;
  }

  return (
    <Suspense>
      <Layout
        title="Add Coins"
        showBack={true}
        onBack={() => router.push("/dashboard")}
      >
        <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0">
          {/* Current Balance */}
          <Card className="bg-duo-bg-purple">
            <div className="text-center">
              <h2 className="text-lg font-medium text-duo-text-primary mb-2">
                Duo Balance
              </h2>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">₹</span>
                <span className="text-4xl font-bold text-duo-text-primary">
                  {user.coins || "0"}
                </span>
              </div>
              <p className="text-sm text-duo-text-secondary mt-2">
                1 coin = ₹1 | Coins are equivalent to real cash
              </p>
            </div>
          </Card>

          {/* Add Coins Form */}
          <Card>
            <Card.Header>
              <Card.Title>Add Coins to Duo Balance</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {/* Amount Input */}
                <Input
                  label="Enter Amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount (₹1 - ₹10,000)"
                  error={error}
                  helper="Minimum ₹1, Maximum ₹10,000"
                  required
                />

                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-medium text-duo-text-primary mb-3">
                    Quick Add
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant="outline"
                        size="small"
                        onClick={() => handleQuickAmount(quickAmount)}
                        className={
                          amount === quickAmount.toString()
                            ? "bg-duo-primary text-white"
                            : ""
                        }
                      >
                        ₹{quickAmount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment Methods Info */}
                <div className="bg-duo-bg-gray p-4 rounded-lg">
                  <h4 className="font-medium text-duo-text-primary mb-2">
                    Accepted Payment Methods
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm text-duo-text-secondary">
                    <div className="flex items-center space-x-2">
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span>Credit Cards</span>
                    </div>
                    <div className="flex items-center space-x-2">
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span>Debit Cards</span>
                    </div>
                    <div className="flex items-center space-x-2">
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
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span>UPI</span>
                    </div>
                    <div className="flex items-center space-x-2">
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>Net Banking</span>
                    </div>
                    <div className="flex items-center space-x-2">
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
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>Wallets</span>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-green-800 font-medium">
                        {success}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add Coins Button */}
                <Button
                  onClick={handlePayment}
                  disabled={!amount || !!error || paymentLoading}
                  loading={paymentLoading}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  {paymentLoading
                    ? "Processing Payment..."
                    : `Add ₹${amount || "0"} to Duo Balance`}
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Security Notice */}
          <Card className="border-l-4 border-l-green-500">
            <Card.Content>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-duo-text-primary">
                    100% Secure Payments
                  </h4>
                  <p className="text-sm text-duo-text-secondary mt-1">
                    Your payment is processed securely through Cashfree Payment
                    Gateway with bank-level encryption. All transactions are PCI
                    DSS compliant and your card details are never stored.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
        {/* Modal prompting profile completion in app for invalid phone */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-5 sm:p-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Complete Account Setup
                </h3>
                <p className="text-sm text-gray-600">
                  Please login on the DuoCortex mobile app and complete your
                  profile (add a valid phone number). Then come back to add
                  coins.
                </p>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.duocortex"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 border-duo-primary text-duo-primary hover:bg-duo-primary hover:text-white transition-colors"
                >
                  Get Android App
                </a>
                <a
                  href="https://apps.apple.com/in/app/duocortex/id6749133589"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Get iOS App
                </a>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="mt-3 w-full bg-duo-primary text-white py-2 rounded-lg hover:bg-duo-primary/90"
              >
                Okay
              </button>
            </div>
          </div>
        )}
      </Layout>
    </Suspense>
  );
}
