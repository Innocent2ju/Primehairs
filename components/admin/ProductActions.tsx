"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import Link from "next/link";

import { useAdminToast } from "@/components/admin/AdminToast";
import { deleteProduct } from "@/lib/admin/actions/product";

interface ProductActionsProps {
  productId: string;
  productName: string;
}

export default function ProductActions({
  productId,
  productName,
}: ProductActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const toast = useAdminToast();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(productId);

      if (result.status === "error") {
        toast.show(result.message, "error");
        return;
      }

      if (result.status !== "success") return;

      setIsConfirming(false);
      toast.show(result.message, "success");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:border-gold/60 hover:text-gold"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        Edit
      </Link>

      {isConfirming ? (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
            className="cursor-pointer rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-light-gray transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          aria-label={`Delete ${productName}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </button>
      )}
    </div>
  );
}
