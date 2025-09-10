"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ENV_CONFIG } from "@/config/environment";
import axios from "axios";

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedSession = useRef(null);

  useEffect(() => {
    // Handle URL error parameters from NextAuth
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (errorParam === "AccessDenied" || errorParam === "AuthError") {
      if (messageParam) {
        setError(decodeURIComponent(messageParam));
      } else {
        setError("Authentication failed. Please try again.");
      }
      // Clean up the URL without reloading the page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (status === "authenticated" && session) {
      const sessionId = `${session.provider}-${session.providerId}-${session.backendToken}`;
      if (processedSession.current === sessionId) {
        return;
      }

      if (
        (session.provider === "apple" || session.provider === "google") &&
        session.backendToken
      ) {
        processedSession.current = sessionId;
        setIsProcessingAuth(true);

        localStorage.setItem("accessToken", session.backendToken);
        if (session.backendUser) {
          localStorage.setItem("userInfo", JSON.stringify(session.backendUser));
        }

        // Set a flag to prevent redirect conflicts and clear NextAuth session
        sessionStorage.setItem("processingAuth", "true");
        signOut({ redirect: false }).then(() => {
          window.dispatchEvent(new CustomEvent("authChange"));
          sessionStorage.removeItem("processingAuth");
          router.push("/dashboard");
        });
      } else if (
        session.provider !== "apple" &&
        session.provider !== "google"
      ) {
        router.push("/dashboard");
      }
    } else if (status === "unauthenticated" && !isProcessingAuth) {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken && window.location.pathname === "/login") {
        router.push("/dashboard");
      }
    }
  }, [status, session, router, searchParams, isProcessingAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const device_id = `web-client-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}`;

      const response = await axios.post(
        `${ENV_CONFIG.BACKEND_URL}/auth/login`,
        {
          email,
          password,
          device_id,
        },
        {
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data && response.data.token) {
        localStorage.setItem("accessToken", response.data.token);
        if (response.data.user) {
          localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        }

        window.dispatchEvent(new CustomEvent("authChange"));
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred during login";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      setError("Failed to initiate Google Sign-In");
      console.error("Google Sign-In error:", error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setError("");
      await signIn("apple", { callbackUrl: "/dashboard" });
    } catch (error) {
      setError("Failed to initiate Apple Sign-In");
      console.error("Apple Sign-In error:", error);
    }
  };

  if (status === "loading" || isProcessingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-12 min-h-screen bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-semibold text-gray-900">
            Welcome back!
          </h2>
          <p className="text-xl text-gray-600">We&apos;re glad to see you</p>
        </div>

        <Card className="p-6" padding="large">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your Email ID"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full bg-purple-50 border-2 border-gray-200"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="pr-10 w-full bg-purple-50 border-2 border-gray-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 text-gray-500 transform -translate-y-1/2"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {error && (
              <div className="text-sm text-center text-red-600">{error}</div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" /> : "Login"}
            </Button>
          </form>

          {/* Signup hint */}
          <p className="mt-4 text-center text-sm text-gray-600">
            New here?{" "}
            <a href="/signup" className="text-duo-primary hover:underline">
              Create an account
            </a>
          </p>

          <div className="mt-6">
            <div className="relative">
              <div className="flex absolute inset-0 items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="flex relative justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Or Login with
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="flex justify-center items-center px-4 py-2 w-full text-sm font-medium text-gray-700 bg-white rounded-md border-2 border-gray-300 hover:bg-gray-200"
              >
                <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleAppleSignIn}
                className="flex justify-center items-center px-4 py-2 w-full text-sm font-medium text-white bg-black rounded-md border-2 border-gray-300 hover:bg-gray-800"
              >
                <svg
                  className="mr-2 w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Continue with Apple
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-white">
          <LoadingSpinner size="large" />
        </div>
      }
    >
      <LoginComponent />
    </Suspense>
  );
}
