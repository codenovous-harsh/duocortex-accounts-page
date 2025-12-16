"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api, { endpoints } from "@/lib/axios";
import { initiatePayment } from "@/lib/cashfree";

export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch event details on mount
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoints.getEventById(eventId));

      if (response.data.status === "success") {
        setEvent(response.data.data);
      } else {
        setError("Failed to load event details");
      }
    } catch (err) {
      console.error("Error fetching event details:", err);
      setError("Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ""))) {
      errors.phoneNumber = "Invalid phone number (10 digits required)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRegistration = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setPaymentLoading(true);
      setError(null);

      // Create event order
      const orderResponse = await api.post(endpoints.createEventOrder, {
        eventId: eventId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phoneNumber,
        order_amount: event.price,
      });

      if (orderResponse.data.status !== "success") {
        throw new Error("Failed to create event order");
      }

      const { payment_session_id, order_id } = orderResponse.data.data;

      if (!payment_session_id) {
        throw new Error("Failed to create payment session");
      }

      // Set return URL with order_id and eventId
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/event-payment-status?order_id=${order_id}&eventId=${eventId}`;

      // Store return URL in session storage for redirect
      sessionStorage.setItem("eventReturnUrl", returnUrl);

      // Initiate payment - this will redirect to payment gateway
      await initiatePayment(payment_session_id, {
        onFailure: (data) => {
          console.error("Payment failed:", data);
          setError("Payment failed. Please try again.");
          setPaymentLoading(false);
        },
      });

      // Note: After successful payment, Cashfree will redirect to /event-payment-status
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout title="Event Registration">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (error && !event) {
    return (
      <Layout title="Event Registration" showBack={true} onBack={() => router.push("/events")}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-lg text-duo-text-primary font-medium mb-4">{error}</p>
              <Button variant="primary" onClick={() => router.push("/events")}>
                Back to Events
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return null;
  }

  const isSoldOut = event.spotsLeft === 0;

  return (
    <Layout
      title="Event Registration"
      showBack={true}
      onBack={() => router.push("/events")}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Event Details Card */}
        <Card className="overflow-hidden">
          {/* Event Image */}
          {event.image?.url && (
            <div className="relative h-64 bg-duo-bg-gray">
              <img
                src={event.image.url}
                alt={event.eventName}
                className="w-full h-full object-cover"
              />
              {/* Spots Badge */}
              <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg">
                <p className="text-sm font-semibold text-duo-text-primary">
                  {isSoldOut ? (
                    <span className="text-red-600">Sold Out</span>
                  ) : (
                    <span className="text-green-600">{event.spotsLeft} spots left</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Event Name */}
            <h1 className="text-3xl font-bold text-duo-text-primary mb-4">
              {event.eventName}
            </h1>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-duo-primary mr-3 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-duo-text-secondary font-medium">Location</p>
                  <p className="text-duo-text-primary">{event.placeOfEvent}</p>
                  {event.googleMapsUrl && (
                    <a
                      href={event.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-duo-primary hover:underline mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-duo-primary mr-3 mt-1 flex-shrink-0"
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
                <div>
                  <p className="text-sm text-duo-text-secondary font-medium">Price</p>
                  <p className="text-2xl font-bold text-duo-primary">₹{event.price}</p>
                </div>
              </div>

              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-duo-primary mr-3 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-duo-text-secondary font-medium">Attendees</p>
                  <p className="text-duo-text-primary">
                    {event.attendeeCount} / {event.maxAttendees} registered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        {!isSoldOut && (
          <Card>
            <Card.Header>
              <Card.Title>Registration Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-center">{error}</p>
                  </div>
                )}

                {/* Full Name */}
                <Input
                  label="Full Name"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  error={formErrors.fullName}
                  required
                />

                {/* Email */}
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  error={formErrors.email}
                  helper="We'll send the confirmation to this email"
                  required
                />

                {/* Phone Number */}
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your 10-digit phone number"
                  error={formErrors.phoneNumber}
                  required
                />

                {/* Payment Summary */}
                <div className="bg-duo-bg-gray p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-duo-text-primary font-medium">Total Amount</span>
                    <span className="text-2xl font-bold text-duo-primary">₹{event.price}</span>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  onClick={handleRegistration}
                  disabled={paymentLoading}
                  loading={paymentLoading}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  {paymentLoading ? "Processing..." : `Pay ₹${event.price} & Register`}
                </Button>

                {/* Security Notice */}
                <div className="flex items-start space-x-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
                  <div>
                    <p className="text-sm text-green-800 font-medium">100% Secure Payment</p>
                    <p className="text-xs text-green-700 mt-1">
                      Powered by Cashfree Payment Gateway with bank-level encryption
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Sold Out Message */}
        {isSoldOut && (
          <Card>
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
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
              <h3 className="text-xl font-bold text-duo-text-primary mb-2">
                Event Sold Out
              </h3>
              <p className="text-duo-text-secondary mb-6">
                This event has reached maximum capacity. Check out other upcoming events.
              </p>
              <Button variant="primary" onClick={() => router.push("/events")}>
                View Other Events
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
