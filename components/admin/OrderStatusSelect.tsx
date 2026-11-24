"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { useAdminToast } from "@/components/admin/AdminToast";
import { updateOrderStatus } from "@/lib/admin/actions/order";
import {
  ORDER_STATUS_OPTIONS,
  type AdminOrderStatus,
} from "@/lib/admin/order-status";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AdminOrderStatus, string> = {
  processed: "border-amber-400/30 text-amber-300",
  shipped: "border-sky-400/30 text-sky-300",
  delivered: "border-green-400/30 text-green-300",
  cancelled: "border-red-400/30 text-red-300",
};

interface OrderStatusSelectProps {
  checkoutId: string;
  status: AdminOrderStatus;
}

export default function OrderStatusSelect({
  checkoutId,
  status,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<AdminOrderStatus>(status);
  const [isPending, startTransition] = useTransition();
  const toast = useAdminToast();

  const handleChange = (next: AdminOrderStatus) => {
    if (next === current) return;

    const previous = current;
    setCurrent(next);

    startTransition(async () => {
      const result = await updateOrderStatus(checkoutId, next);

      if (result.status === "error") {
        setCurrent(previous);
        toast.show(result.message, "error");
        return;
      }

      toast.show(result.message, "success");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Order status"
        value={current}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as AdminOrderStatus)}
        className={cn(
          "cursor-pointer rounded-md border bg-transparent px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide outline-none transition-colors disabled:cursor-wait disabled:opacity-60",
          STATUS_STYLES[current],
        )}
      >
        {ORDER_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#1A1A1A] text-white">
            {option.label}
          </option>
        ))}
      </select>
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin text-gold" aria-hidden="true" />
      ) : null}
    </div>
  );
}
