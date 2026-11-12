"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/actions/admin-support";

export function NotificationActions() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        });
      }}
      className="btn btn-outline"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4" />
      )}
      Mark all as read
    </button>
  );
}
