import { useState } from "react";
import { createPayment, verifyPayment, getOrder } from "@/lib/api";

export function useRazorpayPayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const startPayment = async (orderNumber, shippingDetails = {}) => {
    if (isProcessing) return; // Prevent double-clicks
    
    setError(null);
    setIsProcessing(true);
    setProcessingMessage("Opening secure payment...");
    setIsSuccess(false);

    try {
      // 1. Create Payment Intent
      const paymentIntent = await createPayment(orderNumber);
      
      // 2. Open Razorpay Checkout
      const options = {
        key: paymentIntent.key_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        name: "MaVidhai",
        description: `Order ${orderNumber}`,
        order_id: paymentIntent.razorpay_order_id,
        handler: function (response) {
          handlePaymentSuccess(response, orderNumber);
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setProcessingMessage(null);
            setError("Payment was cancelled. Your order hasn't been cancelled.");
          }
        },
        prefill: {
          name: shippingDetails.shipping_full_name || "",
          email: shippingDetails.shipping_email || "",
          contact: shippingDetails.shipping_phone || "",
        },
        theme: {
          color: "#d1a11c",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setIsProcessing(false);
        setProcessingMessage(null);
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to initialize payment.");
      setIsProcessing(false);
      setProcessingMessage(null);
    }
  };

  const handlePaymentSuccess = async (response, orderNumber) => {
    try {
      setProcessingMessage("Verifying signature...");
      const verifyRes = await verifyPayment({
        order_number: orderNumber,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (verifyRes.status === "success") {
        setProcessingMessage("Payment processing... confirming order...");
        
        let attempts = 0;
        let confirmed = false;
        
        while (attempts < 4) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          try {
            const order = await getOrder(orderNumber);
            if (order.status === "confirmed") {
              confirmed = true;
              break;
            }
          } catch (e) {
            console.error("Error polling order:", e);
          }
        }
        
        setIsSuccess(true);
        if (confirmed) {
          setSuccessMessage(`Order #${orderNumber} has been successfully confirmed!`);
        } else {
          setSuccessMessage(`Payment submitted successfully! Order #${orderNumber}. We are still confirming your payment with the provider.`);
        }
      } else {
        setError("Payment verification failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during payment verification.");
    } finally {
      setIsProcessing(false);
      setProcessingMessage(null);
    }
  };

  return {
    startPayment,
    isProcessing,
    processingMessage,
    error,
    isSuccess,
    successMessage,
    setError
  };
}
