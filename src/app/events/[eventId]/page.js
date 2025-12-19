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
  const [email, setEmail] = useState("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [attendees, setAttendees] = useState([
    { fullName: "", phoneNumber: "", collegeName: "", gender: "male" }
  ]);
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

  // Update attendee count and adjust attendees array
  const handleAttendeeCountChange = (count) => {
    const newCount = parseInt(count);
    setAttendeeCount(newCount);

    const newAttendees = [...attendees];
    if (newCount > attendees.length) {
      // Add more attendee slots
      for (let i = attendees.length; i < newCount; i++) {
        newAttendees.push({ fullName: "", phoneNumber: "", collegeName: "", gender: "male" });
      }
    } else if (newCount < attendees.length) {
      // Remove extra attendee slots
      newAttendees.splice(newCount);
    }
    setAttendees(newAttendees);
  };

  const handleAttendeeChange = (index, field, value) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);

    // Clear error for this field
    if (formErrors[`attendee${index}_${field}`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`attendee${index}_${field}`];
      setFormErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate email
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
    }

    // Validate each attendee
    attendees.forEach((attendee, index) => {
      if (!attendee.fullName.trim()) {
        errors[`attendee${index}_fullName`] = `Attendee ${index + 1}: Full name is required`;
      }

      if (!attendee.phoneNumber.trim()) {
        errors[`attendee${index}_phoneNumber`] = `Attendee ${index + 1}: Phone number is required`;
      } else if (!/^\d{10}$/.test(attendee.phoneNumber.replace(/\D/g, ""))) {
        errors[`attendee${index}_phoneNumber`] = `Attendee ${index + 1}: Invalid phone number (10 digits required)`;
      }

      if (!attendee.collegeName.trim()) {
        errors[`attendee${index}_collegeName`] = `Attendee ${index + 1}: College name is required`;
      }

      if (!attendee.gender || !["male", "female"].includes(attendee.gender)) {
        errors[`attendee${index}_gender`] = `Attendee ${index + 1}: Gender is required`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (formErrors.email) {
      const newErrors = { ...formErrors };
      delete newErrors.email;
      setFormErrors(newErrors);
    }
  };

  const handleRegistration = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setPaymentLoading(true);
      setError(null);

      // Check gender capacity if limits are set
      const maleCount = attendees.filter(a => a.gender === "male").length;
      const femaleCount = attendees.filter(a => a.gender === "female").length;

      if (event.maleSpotsLeft !== null && maleCount > event.maleSpotsLeft) {
        setError(`Not enough male spots available. Only ${event.maleSpotsLeft} male spot(s) remaining.`);
        setPaymentLoading(false);
        return;
      }

      if (event.femaleSpotsLeft !== null && femaleCount > event.femaleSpotsLeft) {
        setError(`Not enough female spots available. Only ${event.femaleSpotsLeft} female spot(s) remaining.`);
        setPaymentLoading(false);
        return;
      }

      // Create event order
      const orderResponse = await api.post(endpoints.createEventOrder, {
        eventId: eventId,
        customer_email: email,
        attendees: attendees.map(a => ({
          fullName: a.fullName.trim(),
          phoneNumber: a.phoneNumber.trim(),
          collegeName: a.collegeName.trim(),
          gender: a.gender,
        })),
      });

      if (orderResponse.data.status !== "success") {
        const errorMessage = orderResponse.data.error || "Failed to create event order";
        throw new Error(errorMessage);
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

      // Extract error message from API response
      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;

        // Provide user-friendly messages for specific errors
        if (err.response.data.code === "already_registered") {
          errorMessage = "You are already registered for this event. Check your email for confirmation details.";
        } else if (errorMessage.includes("full")) {
          errorMessage = "Sorry, this event is now full. No more spots available.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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
              {/* Event Date and Time */}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-duo-text-secondary font-medium">Date & Time</p>
                  <p className="text-duo-text-primary">
                    {formatDate(event.eventDate)} at {event.eventTime}
                  </p>
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

                {/* Email */}
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  error={formErrors.email}
                  helper="We'll send the confirmation to this email"
                  required
                />

                {/* Number of Attendees */}
                <div>
                  <label className="block text-sm font-medium text-duo-text-primary mb-2">
                    Number of Attendees <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={attendeeCount}
                    onChange={(e) => handleAttendeeCountChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-duo-primary"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                    ))}
                  </select>
                  <p className="text-xs text-duo-text-secondary mt-1">
                    Select how many people you want to register (including yourself)
                  </p>
                </div>

                {/* Gender Capacity Info */}
                {(event.maleSpotsLeft !== null || event.femaleSpotsLeft !== null) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">Gender-specific capacity:</p>
                    <div className="flex gap-4 text-xs text-blue-700">
                      {event.maleSpotsLeft !== null && (
                        <span>Male: {event.maleSpotsLeft} spots left</span>
                      )}
                      {event.femaleSpotsLeft !== null && (
                        <span>Female: {event.femaleSpotsLeft} spots left</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendee Details */}
                {attendees.map((attendee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-duo-text-primary mb-3">
                      Attendee {index + 1}
                    </h3>

                    <Input
                      label="Full Name"
                      type="text"
                      value={attendee.fullName}
                      onChange={(e) => handleAttendeeChange(index, 'fullName', e.target.value)}
                      placeholder="Enter full name"
                      error={formErrors[`attendee${index}_fullName`]}
                      required
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      value={attendee.phoneNumber}
                      onChange={(e) => handleAttendeeChange(index, 'phoneNumber', e.target.value)}
                      placeholder="Enter 10-digit phone number"
                      error={formErrors[`attendee${index}_phoneNumber`]}
                      required
                    />

                    <Input
                      label="College Name"
                      type="text"
                      value={attendee.collegeName}
                      onChange={(e) => handleAttendeeChange(index, 'collegeName', e.target.value)}
                      placeholder="Enter college name"
                      error={formErrors[`attendee${index}_collegeName`]}
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-duo-text-primary mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender${index}`}
                            value="male"
                            checked={attendee.gender === "male"}
                            onChange={(e) => handleAttendeeChange(index, 'gender', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-duo-text-primary">Male</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender${index}`}
                            value="female"
                            checked={attendee.gender === "female"}
                            onChange={(e) => handleAttendeeChange(index, 'gender', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-duo-text-primary">Female</span>
                        </label>
                      </div>
                      {formErrors[`attendee${index}_gender`] && (
                        <p className="text-sm text-red-600 mt-1">{formErrors[`attendee${index}_gender`]}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Payment Summary */}
                <div className="bg-duo-bg-gray p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-duo-text-primary font-medium">Price per person</span>
                    <span className="text-duo-text-primary">₹{event.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-duo-text-primary font-medium">Number of attendees</span>
                    <span className="text-duo-text-primary">× {attendeeCount}</span>
                  </div>
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-duo-text-primary font-bold">Total Amount</span>
                    <span className="text-2xl font-bold text-duo-primary">₹{event.price * attendeeCount}</span>
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
                  {paymentLoading ? "Processing..." : `Pay ₹${event.price * attendeeCount} & Register`}
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
