"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api, { endpoints } from "@/lib/axios";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoints.getEvents);

      if (response.data.status === "success") {
        setEvents(response.data.data);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
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
      <Layout title="Events">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Events" showBack={true} onBack={() => router.push("/")}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-duo-text-primary mb-2">
            Upcoming Events
          </h1>
          <p className="text-duo-text-secondary">
            Register for exciting events and expand your network
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-center">{error}</p>
            <div className="flex justify-center mt-3">
              <Button
                variant="outline"
                size="small"
                onClick={fetchEvents}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Events List */}
        {!error && events.length === 0 && !loading && (
          <Card className="text-center py-12">
            <div className="text-duo-text-secondary">
              <p className="text-lg font-medium mb-2">No events available</p>
              <p className="text-sm">Check back later for upcoming events</p>
            </div>
          </Card>
        )}

        {!error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <Card
                key={event._id}
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
                padding="none"
              >
                {/* Event Image */}
                {event.image?.url && (
                  <div className="relative h-48 bg-duo-bg-gray">
                    <img
                      src={event.image.url}
                      alt={event.eventName}
                      className="w-full h-full object-cover"
                    />
                    {/* Spots Badge */}
                    <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-md">
                      <p className="text-xs font-semibold text-duo-text-primary">
                        {event.spotsLeft > 0 ? (
                          <span className="text-green-600">
                            {event.spotsLeft} spots left
                          </span>
                        ) : (
                          <span className="text-red-600">Sold Out</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {/* Event Name */}
                  <h3 className="text-xl font-bold text-duo-text-primary mb-2">
                    {event.eventName}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    {/* Event Date and Time */}
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-duo-text-secondary mr-2 flex-shrink-0"
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
                      <p className="text-sm text-duo-text-secondary">
                        {formatDate(event.eventDate)} at {event.eventTime}
                      </p>
                    </div>

                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-duo-text-secondary mr-2 mt-0.5 flex-shrink-0"
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
                      <p className="text-sm text-duo-text-secondary">
                        {event.placeOfEvent}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-duo-text-secondary mr-2 flex-shrink-0"
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
                      <p className="text-lg font-bold text-duo-primary">
                        ₹{event.price}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-duo-text-secondary mr-2 flex-shrink-0"
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
                      <p className="text-sm text-duo-text-secondary">
                        {event.attendeeCount} / {event.maxAttendees} registered
                      </p>
                    </div>
                  </div>

                  {/* Register Button */}
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={event.spotsLeft === 0}
                    onClick={() => router.push(`/events/${event._id}`)}
                  >
                    {event.spotsLeft === 0 ? "Sold Out" : "Register Now"}
                  </Button>

                  {/* Google Maps Link */}
                  {event.googleMapsUrl && (
                    <a
                      href={event.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 text-center text-sm text-duo-primary hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
