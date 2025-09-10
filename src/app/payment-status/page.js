"use client";
import { Suspense } from "react";
import CoinIcon from "@/components/ui/CoinIcon";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";
import { verifyPayment } from "@/lib/cashfree";

// Separate component that uses useSearchParams
function PaymentStatusContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const paymentId = searchParams.get("payment_id");
    const amount = searchParams.get("amount");

    if (orderId) {
      handlePaymentVerification(orderId, paymentId, amount);
    } else {
      setStatus("error");
      setMessage("Invalid payment information. Please try again.");
    }
  }, [searchParams]);

  const handlePaymentVerification = async (orderId, paymentId, amount) => {
    try {
      console.log("Verifying payment for order:", orderId);

      // Verify payment with backend
      const verification = await verifyPayment(orderId);
      console.log("Payment verification result:", verification);

      if (verification.status === "SUCCESS") {
        setStatus("success");
        // Only show amount if it's available and valid
        const validAmount =
          amount && amount !== "N/A" && !isNaN(amount) ? amount : null;
        setMessage(
          validAmount
            ? `Payment of ₹${validAmount} was successful!`
            : `Payment was successful!`
        );
        setPaymentData({
          orderId,
          paymentId,
          amount: validAmount,
        });

        // Refresh user data to get updated wallet balance - like mobile app
        console.log("Refreshing user data after successful payment...");
        if (refreshUser) {
          try {
            await refreshUser();
            console.log("User data refreshed successfully");
          } catch (refreshError) {
            console.error("Error refreshing user data:", refreshError);
            // Don't fail the whole flow if refresh fails
          }
        }
      } else {
        console.error("Payment verification failed:", verification);
        throw new Error(
          `Payment verification failed: ${
            verification.payment_status || "Unknown status"
          }`
        );
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus("error");
      setMessage(
        `Payment verification failed: ${error.message}. If money was deducted, it will be refunded within 5-7 business days.`
      );
    }
  };

  const handleContinue = () => {
    if (status === "success") {
      router.push("/dashboard");
    } else {
      router.push("/wallet");
    }
  };

  const getIcon = () => {
    switch (status) {
      case "success":
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>
        );
      case "error":
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <div className="flex items-center justify-center mb-4">
            <LoadingSpinner size="large" />
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      default:
        return "text-duo-text-primary";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <Card.Content>
          <div className="text-center py-8">
            {getIcon()}

            <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
              {status === "success"
                ? "Payment Successful!"
                : status === "error"
                ? "Payment Failed"
                : "Processing Payment..."}
            </h2>

            <p className="text-duo-text-secondary mb-6">{message}</p>

            {paymentData && status === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Order ID:</span>
                    <span className="font-mono text-green-800">
                      {paymentData.orderId}
                    </span>
                  </div>
                  {paymentData.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment ID:</span>
                      <span className="font-mono text-green-800">
                        {paymentData.paymentId}
                      </span>
                    </div>
                  )}
                  {paymentData.amount && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount:</span>
                      <span className="font-semibold text-green-800">
                        ₹{paymentData.amount}
                      </span>
                    </div>
                  )}
                  {user && (
                    <div className="flex justify-between">
                      <span className="text-green-700">New Balance:</span>
                      <div className="flex items-center space-x-1">
                        <CoinIcon size={18} className="" />
                        <span className="font-semibold text-green-800">
                          {user.coins || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status !== "processing" && (
              <Button
                onClick={handleContinue}
                variant={status === "success" ? "primary" : "secondary"}
                size="large"
                className="w-full"
              >
                {status === "success" ? "Continue to Dashboard" : "Try Again"}
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      {status === "success" && (
        <Card className="mt-6 border-l-4 border-l-green-500">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-800">
                  What&apos;s Next?
                </h4>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• Your <CoinIcon size={14} className="inline mx-1" />duo balance has been added to your wallet</li>
                  <li>• You can now participate in quizzes</li>
                  <li>• Track your transactions in the history section</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

// Main component with proper Suspense boundary
export default function PaymentStatus() {
  return (
    <Layout title="Payment Status">
      <Suspense fallback={<LoadingSpinner size="large" />}>
        <PaymentStatusContent />
      </Suspense>
    </Layout>
  );
}
