"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import SwipeToast from "@/components/SwipeToast";

export type AdminToastTone = "success" | "error" | "info";

interface ToneStyle {
  color: string;
  fuseColor: string;
  background: string;
  icon: React.ReactNode;
}

const TONES: Record<AdminToastTone, ToneStyle> = {
  success: {
    color: "#22c55e",
    fuseColor: "#16a34a",
    background: "#0d1f13",
    icon: <CheckCircle2 className="size-5" />,
  },
  error: {
    color: "#ef4444",
    fuseColor: "#dc2626",
    background: "#241013",
    icon: <XCircle className="size-5" />,
  },
  info: {
    color: "#D4AF37",
    fuseColor: "#b8962e",
    background: "#1A1A1A",
    icon: <Info className="size-5" />,
  },
};

interface AdminToastData {
  id: number;
  title: string;
  description?: string;
  tone: AdminToastTone;
}

type ShowToast = (
  title: string,
  tone?: AdminToastTone,
  description?: string,
) => void;

const AdminToastContext = createContext<{ show: ShowToast } | null>(null);

/**
 * One SwipeToast host for the whole admin area. Living in the layout means the
 * toast survives `router.refresh()` after a product or order is updated.
 */
export function AdminToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<AdminToastData | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback<ShowToast>((title, tone = "info", description) => {
    setToast({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      description,
      tone,
    });
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const style = toast ? TONES[toast.tone] : null;

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {toast && style ? (
        <SwipeToast
          key={toast.id}
          open
          title={toast.title}
          description={toast.description}
          icon={style.icon}
          color={style.color}
          fuseColor={style.fuseColor}
          background={style.background}
          duration={6000}
          pauseOnHover
          closeButton
          dismissible
          inline={false}
          onClose={dismiss}
          className="z-[100]"
        />
      ) : null}
    </AdminToastContext.Provider>
  );
}

/**
 * Transient admin feedback. Use it only for outcomes that matter (saved,
 * deleted, failed) — inline field errors stay next to the field they belong to.
 */
export function useAdminToast() {
  const context = useContext(AdminToastContext);

  if (!context) {
    throw new Error("useAdminToast must be used inside AdminToastProvider.");
  }

  return context;
}
