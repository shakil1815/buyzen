"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPinOff } from "lucide-react";
import { withdrawLocationConsentAction } from "@/lib/actions/admin-customers";

export function WithdrawLocationButton({
  customerId,
}: {
  customerId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            "Remove the stored location for this customer? Their consent record will be withdrawn.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          await withdrawLocationConsentAction(customerId);
          router.refresh();
        });
      }}
      className="btn btn-outline"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPinOff className="h-4 w-4" />
      )}
      Withdraw location
    </button>
  );
}
