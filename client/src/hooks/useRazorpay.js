/**
 * Lazy-loads the Razorpay Checkout script on demand.
 * The script is injected only ONCE per page session — subsequent calls
 * return the already-resolved promise immediately (no duplicate loads).
 *
 * Usage:
 *   import { loadRazorpay } from '../hooks/useRazorpay';
 *   await loadRazorpay();
 *   const rzp = new window.Razorpay(options);
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

export function loadRazorpay() {
  // Already loaded — resolve immediately
  if (window.Razorpay) {
    return Promise.resolve();
  }

  // In-flight load — return same promise to avoid duplicate injections
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow retry on next attempt
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}
