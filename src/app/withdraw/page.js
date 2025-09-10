"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api, { endpoints } from "@/lib/axios";

export default function Withdraw() {
  const { user, authenticated, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    bankName: "",
    ifscCode: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/");
    }
  }, [authenticated, loading, router]);

  const availableCoins = parseFloat(user?.availableCoins || 0);
  const totalCoins = parseFloat(user?.coins || 0);

  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = "Amount is required";
    } else if (amount < 100) {
      newErrors.amount = "Minimum withdrawal amount is ₹100";
    } else if (amount > availableCoins) {
      newErrors.amount = "Amount exceeds available coins";
    }

    // Account holder name
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    // Account number
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (
      formData.accountNumber.length < 9 ||
      formData.accountNumber.length > 18
    ) {
      newErrors.accountNumber = "Account number must be 9-18 digits";
    }

    // Confirm account number
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    // Bank name
    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    // IFSC code
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!ifscPattern.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = "Invalid IFSC code format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      // Submit withdrawal request directly without verification
      const response = await api.post("user/request-withdrawal", {
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode.toUpperCase(),
        amount: parseFloat(formData.amount),
      });

      if (response.data.success || response.data.status === "success") {
        // Show success modal instead of inline message
        setSuccessData({
          message:
            response.data.message ||
            "Withdrawal request submitted successfully!",
          amount: formData.amount,
        });
        setShowSuccessModal(true);

        // Clear form
        setFormData({
          amount: "",
          accountHolderName: "",
          accountNumber: "",
          confirmAccountNumber: "",
          bankName: "",
          ifscCode: "",
        });
      } else {
        throw new Error(response.data.message || "Withdrawal request failed");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setErrors({
        submit:
          err.response?.data?.message ||
          err.message ||
          "Withdrawal request failed",
      });
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0">
      {/* Balance Overview - matching mobile app exactly */}
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
                  {totalCoins}
                </span>
              </div>
            </div>
          </div>

          {/* Available for Withdrawal */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-duo-text-primary mb-2">
              Available for Withdrawal
            </h3>
            <div className="flex items-center space-x-1">
              <span className="text-3xl">₹</span>
              <span className="text-4xl font-bold text-duo-text-primary">
                {availableCoins}
              </span>
            </div>
            <p className="text-sm text-duo-text-secondary mt-2">
              Minimum withdrawal: ₹100 | Processing time: 24-48 hours
            </p>
          </div>
        </Card.Content>
      </Card>

      {success && (
        <Card className="border-l-4 border-l-green-500">
          <Card.Content>
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 text-green-600 flex-shrink-0"
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
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Withdrawal Form */}
      <Card>
        <Card.Header>
          <Card.Title>Withdrawal Details</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <Input
              label="Withdrawal Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount (min ₹100)"
              error={errors.amount}
              helper={`Available: ₹${availableCoins}`}
              required
            />

            {/* Bank Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-duo-text-primary border-b border-duo-border pb-2">
                Bank Account Details
              </h4>

              <Input
                label="Account Holder Name"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Full name as per bank account"
                error={errors.accountHolderName}
                required
              />

              <Input
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter bank account number"
                error={errors.accountNumber}
                required
              />

              <Input
                label="Confirm Account Number"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={handleInputChange}
                placeholder="Re-enter account number"
                error={errors.confirmAccountNumber}
                required
              />

              <Input
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                error={errors.bankName}
                required
              />

              <Input
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="Enter IFSC code (e.g., SBIN0001234)"
                error={errors.ifscCode}
                required
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <span className="text-red-800 text-sm">{errors.submit}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              loading={submitting}
              disabled={availableCoins < 100 || submitting}
            >
              {availableCoins < 100
                ? "Insufficient Balance (Min ₹100)"
                : submitting
                ? "Processing..."
                : "Submit Withdrawal Request"}
            </Button>
          </form>
        </Card.Content>
      </Card>

      {/* Important Notes */}
      <Card className="border-l-4 border-l-yellow-500">
        <Card.Content>
          <div className="space-y-3">
            <h4 className="font-medium text-duo-text-primary flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Important Information
            </h4>
            <ul className="text-sm text-duo-text-secondary space-y-1 ml-7">
              <li>• Withdrawal requests are processed within 24-48 hours</li>
              <li>• Minimum withdrawal amount is ₹100</li>
              <li>
                • Ensure bank details are correct - incorrect details may cause
                delays
              </li>
              <li>• You will receive an email confirmation once processed</li>
              <li>
                • Contact support if you don&apos;t receive funds within 48
                hours
              </li>
            </ul>
          </div>
        </Card.Content>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
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

              {/* Success Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Withdrawal Request Submitted!
              </h3>

              {/* Success Message */}
              <p className="text-gray-600 mb-4">{successData?.message}</p>

              {/* Amount Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-green-800">
                  <strong>Amount:</strong> ₹{successData?.amount}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Processing time: 24-48 hours
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
                className="w-full bg-duo-primary text-white py-2 px-4 rounded-lg hover:bg-duo-primary/90 transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
