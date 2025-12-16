import axios from "axios";

import { ENV_CONFIG } from '@/config/environment';

// Use the same backend URL as the mobile app
const BACKEND_URL = ENV_CONFIG.BACKEND_URL;

// API endpoints
export const endpoints = {
  login: "auth/login",
  profileUpdate: "user/update",
  getProfile: "user/user-details",
  requestWithdrawal: "user/request-withdrawal",
  // Payment endpoints
  createOrder: "api/create-order",
  getOrderStatus: "api/get-order-status",
  // Transaction history
  quizHistory: "quizzes/history",
  // Event endpoints
  getEvents: "events",
  getEventById: (eventId) => `events/${eventId}`,
  createEventOrder: "create-event-order",
  verifyEventPayment: "verify-event-payment",
};

// Create axios instance for API calls
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

// Request interceptor to add token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Axios interceptor: Adding token to request', config.url);
      } else {
        console.log('Axios interceptor: No token found for request', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
