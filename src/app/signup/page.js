"use client";

import React from "react";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Signup() {
  return (
    <Layout title="Create Account" showHeader={false}>
      <div className="flex items-center justify-center min-h-[70vh] px-2 sm:px-0">
        <Card className="w-full max-w-md p-6" padding="large">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Sign up on the app
            </h2>
            <p className="mb-4 text-gray-600">
              For security and KYC, account creation is available only on the
              DuoCortex mobile app.
            </p>

            <div className="p-4 mb-4 text-left border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-800">
                Please install the app, complete your profile (including a valid
                phone number), and then login here to manage your Duo Balance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.duocortex"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 transition-colors border-2 rounded-lg border-duo-primary text-duo-primary hover:bg-duo-primary hover:text-white"
              >
                Get Android App
              </a>
              <a
                href="https://apps.apple.com/in/app/duocortex/id6749133589"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Get iOS App
              </a>
            </div>

            <Button onClick={() => history.back()} className="w-full mt-4">
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
