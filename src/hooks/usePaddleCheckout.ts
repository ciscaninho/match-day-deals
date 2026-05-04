import { useState } from "react";
import { toast } from "sonner";

interface OpenCheckoutOptions {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  successUrl?: string;
}

// Payments are temporarily disabled before launch for security reasons.
// The original Paddle integration is preserved in git history and will be
// re-enabled in a future update after full testing.
export const PAYMENTS_DISABLED = true;
export const PAYMENTS_DISABLED_MESSAGE = "Paiements bientôt disponibles";

export function usePaddleCheckout() {
  const [loading] = useState(false);

  const openCheckout = async (_options: OpenCheckoutOptions) => {
    toast.info(PAYMENTS_DISABLED_MESSAGE);
    return;
  };

  return { openCheckout, loading };
}
