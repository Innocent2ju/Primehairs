"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAdminToast } from "@/components/admin/AdminToast";

interface ProductsFlashToastProps {
  created: boolean;
  updated: boolean;
}

/**
 * Turns the `?created=1` / `?updated=1` redirect flags into a single toast,
 * then clears the query string so a refresh does not repeat the message.
 */
export default function ProductsFlashToast({
  created,
  updated,
}: ProductsFlashToastProps) {
  const router = useRouter();
  const toast = useAdminToast();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown || (!created && !updated)) return;

    setShown(true);
    toast.show(created ? "Product created." : "Product updated.", "success");
    router.replace("/admin/products", { scroll: false });
  }, [created, updated, shown, toast, router]);

  return null;
}
