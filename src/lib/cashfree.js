import api, { endpoints } from "./axios";

// Cashfree configuration matching React Native app
const CASHFREE_CONFIG = {
  clientId: process.env.CASHFREE_CLIENT_ID,
  clientSecret: process.env.CASHFREE_CLIENT_SECRET,
  environment: "SANDBOX", // Change to 'PRODUCTION' for live
};

/**
 * Create payment order using the same API as React Native app
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Payment session data
 */
export async function createPaymentSession(orderData) {
  try {
    // Add return URL for payment callback
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const response = await api.post(
      endpoints.createOrder,
      {
        customer_id: orderData.customer_id,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone || "N/A",
        order_amount: orderData.amount,
      },
      {
        headers: {
          "x-client-id": CASHFREE_CONFIG.clientId,
          "x-client-secret": CASHFREE_CONFIG.clientSecret,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating payment session:", error);
    const code =
      error.response?.data?.details?.code || error.response?.data?.code;
    const message =
      error.response?.data?.details?.message ||
      error.response?.data?.message ||
      "Failed to create payment order";
    const err = new Error(message);
    err.code = code;
    throw err;
  }
}

/**
 * Initialize Cashfree Web SDK and handle payment
 * @param {string} sessionId - Payment session ID
 * @param {Object} options - Payment options
 * @returns {Promise<Object>} Payment result
 */
export async function initiatePayment(sessionId, options = {}) {
  try {
    // Load Cashfree SDK dynamically
    const { load } = await import("@cashfreepayments/cashfree-js");

    const cashfree = await load({
      mode: CASHFREE_CONFIG.environment.toLowerCase(),
    });

    const checkoutOptions = {
      paymentSessionId: sessionId,
      redirectTarget: "_self",
    };

    // Handle the checkout - this will redirect to payment gateway
    const result = await cashfree.checkout(checkoutOptions);

    // Note: For redirect flow, this code may not execute as the page will redirect
    // The callback will be handled by the payment-status page
    if (result.error) {
      if (options.onFailure) {
        options.onFailure(result.error);
      }
      throw new Error(result.error.message || "Payment failed");
    }

    return result;
  } catch (error) {
    console.error("Payment initiation failed:", error);
    if (options.onFailure) {
      options.onFailure({ error: error.message });
    }
    throw error;
  }
}

/**
 * Verify payment status using the same API as React Native app
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Payment verification result
 */
export async function verifyPayment(orderId) {
  try {
    const response = await api.get(
      `${endpoints.getOrderStatus}?order_id=${orderId}`
    );

    console.log("Payment verification response:", response.data);

    // Handle different possible response formats
    const orderStatus = response.data.order_status || response.data.status;
    const isSuccess = orderStatus === "PAID" || orderStatus === "SUCCESS";

    return {
      status: isSuccess ? "SUCCESS" : "FAILED",
      order_id: orderId,
      payment_status: orderStatus,
      raw_response: response.data,
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw new Error("Payment verification failed");
  }
}

export { CASHFREE_CONFIG };
