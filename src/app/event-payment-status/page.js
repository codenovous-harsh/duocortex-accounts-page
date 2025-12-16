"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api, { endpoints } from "@/lib/axios";
import { Suspense } from "react";

function EventPaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const eventId = searchParams.get("eventId");

  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [attendeeDetails, setAttendeeDetails] = useState(null);

  // Verify payment on mount
  useEffect(() => {
    if (orderId) {
      verifyEventPayment();
    } else {
      setError("Invalid payment request. Order ID not found.");
      setLoading(false);
    }
  }, [orderId]);

  const verifyEventPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call verify-event-payment endpoint
      const response = await api.get(
        `${endpoints.verifyEventPayment}?order_id=${orderId}`
      );

      console.log("Payment verification response:", response.data);

      if (response.data.status === "success") {
        setPaymentStatus("success");
        setEventDetails(response.data.data.eventDetails);
        setAttendeeDetails(response.data.data.attendeeDetails);
      } else {
        setPaymentStatus("failed");
        setError(response.data.message || "Payment verification failed");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setPaymentStatus("failed");
      setError(
        err.response?.data?.message ||
          "Payment verification failed. Please contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Payment Status">
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="large" />
          <p className="text-duo-text-secondary mt-4">Verifying your payment...</p>
        </div>
      </Layout>
    );
  }

  // Success State
  if (paymentStatus === "success" && eventDetails && attendeeDetails) {
    return (
      <Layout title="Registration Successful">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Card */}
          <Card className="text-center border-2 border-green-500">
            <div className="py-8">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600"
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

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Registration Successful!
              </h1>
              <p className="text-duo-text-secondary mb-6">
                Your payment has been confirmed and registration is complete.
              </p>

              {/* Confirmation Email Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-900 font-medium">
                      Confirmation Email Sent
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      We've sent a confirmation email to{" "}
                      <span className="font-medium">{attendeeDetails.email}</span> with
                      your event details and registration information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Event Details Card */}
          <Card>
            <Card.Header>
              <Card.Title>Event Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Event Image */}
                {eventDetails.image?.url && (
                  <div className="relative h-48 bg-duo-bg-gray rounded-lg overflow-hidden">
                    <img
                      src={eventDetails.image.url}
                      alt={eventDetails.eventName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Event Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-duo-text-secondary">Event Name</p>
                    <p className="text-lg font-semibold text-duo-text-primary">
                      {eventDetails.eventName}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-duo-text-secondary">Location</p>
                    <p className="text-duo-text-primary">{eventDetails.placeOfEvent}</p>
                    {eventDetails.googleMapsUrl && (
                      <a
                        href={eventDetails.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-duo-primary hover:underline mt-1 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-duo-text-secondary">Amount Paid</p>
                    <p className="text-2xl font-bold text-duo-primary">
                      ₹{attendeeDetails.amountPaid}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Registration Details Card */}
          <Card>
            <Card.Header>
              <Card.Title>Your Registration Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-duo-text-secondary">Full Name</span>
                  <span className="text-duo-text-primary font-medium">
                    {attendeeDetails.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-duo-text-secondary">Email</span>
                  <span className="text-duo-text-primary font-medium">
                    {attendeeDetails.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-duo-text-secondary">Phone</span>
                  <span className="text-duo-text-primary font-medium">
                    {attendeeDetails.phoneNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-duo-text-secondary">Registration Date</span>
                  <span className="text-duo-text-primary font-medium">
                    {new Date(attendeeDetails.registeredAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-duo-text-secondary">Order ID</span>
                  <span className="text-duo-text-primary font-mono text-sm">
                    {attendeeDetails.orderId}
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => router.push("/events")}
              className="w-full max-w-md"
            >
              View More Events
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Failed State
  if (paymentStatus === "failed" || error) {
    return (
      <Layout title="Payment Failed">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center border-2 border-red-500">
            <div className="py-8">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-red-600"
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

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
              <p className="text-duo-text-secondary mb-6">
                {error || "Your payment could not be processed. Please try again."}
              </p>

              {/* Error Details */}
              {orderId && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Order ID:</span>{" "}
                    <span className="font-mono">{orderId}</span>
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    If you were charged, please contact support with this Order ID.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push("/events")}
                  className="w-full"
                >
                  Back to Events
                </Button>
                {eventId && (
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/events/${eventId}`)}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return null;
}

export default function EventPaymentStatus() {
  return (
    <Suspense
      fallback={
        <Layout title="Payment Status">
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size="large" />
          </div>
        </Layout>
      }
    >
      <EventPaymentStatusContent />
    </Suspense>
  );
}
