"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { useAdminToast } from "@/components/admin/AdminToast";
import { updateDeliverySettings } from "@/lib/admin/actions/delivery";
import type { DeliverySettings } from "@/lib/delivery-settings";
import { cn } from "@/lib/utils";

interface DeliverySettingsFormProps {
  settings: DeliverySettings;
}

const inputClassName =
  "w-full rounded-lg border border-white/15 bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-white placeholder:text-light-gray/40 outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20";

const labelClassName =
  "block text-[11px] font-semibold uppercase tracking-wider text-light-gray/70";

export default function DeliverySettingsForm({
  settings,
}: DeliverySettingsFormProps) {
  const [doorstepFee, setDoorstepFee] = useState(
    settings.doorstepFeeNgn.toFixed(2),
  );
  const [branchFee, setBranchFee] = useState(
    settings.branchPickupFeeNgn.toFixed(2),
  );
  const [locations, setLocations] = useState<string[]>(settings.branchLocations);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useAdminToast();

  const updateLocation = (index: number, value: string) => {
    setLocations((current) =>
      current.map((location, position) => (position === index ? value : location)),
    );
  };

  const removeLocation = (index: number) => {
    setLocations((current) =>
      current.filter((_, position) => position !== index),
    );
  };

  const addLocation = () => {
    setLocations((current) => [...current, ""]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await updateDeliverySettings({
        doorstepFeeNgn: doorstepFee,
        branchPickupFeeNgn: branchFee,
        branchLocations: locations,
      });

      if (result.status === "error") {
        toast.show(result.message, "error");
        return;
      }

      toast.show(result.message, "success");
    } catch {
      toast.show(
        "Could not save delivery settings. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/70 p-5 sm:p-6">
        <header className="mb-5">
          <h2 className="font-playfair text-lg font-bold text-white">Fees</h2>
          <p className="mt-1 text-xs text-light-gray/60">
            Charged at checkout and verified again when Paystack confirms the
            payment.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="doorstep-fee" className={labelClassName}>
              Doorstep Delivery Fee (₦)
            </label>
            <input
              id="doorstep-fee"
              inputMode="decimal"
              value={doorstepFee}
              onChange={(event) => setDoorstepFee(event.target.value)}
              placeholder="2000.00"
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="branch-fee" className={labelClassName}>
              Branch Pickup Fee (₦)
            </label>
            <input
              id="branch-fee"
              inputMode="decimal"
              value={branchFee}
              onChange={(event) => setBranchFee(event.target.value)}
              placeholder="0.00"
              className={inputClassName}
            />
            <p className="text-[11px] text-light-gray/50">
              Use 0 to make branch pickup free.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/70 p-5 sm:p-6">
        <header className="mb-5">
          <h2 className="font-playfair text-lg font-bold text-white">
            Pickup Branches
          </h2>
          <p className="mt-1 text-xs text-light-gray/60">
            These are the locations customers can choose at checkout.
          </p>
        </header>

        {locations.length === 0 ? (
          <p className="text-sm text-light-gray/60">
            No branches yet. Add at least one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {locations.map((location, index) => (
              <li key={index} className="flex items-center gap-3">
                <input
                  value={location}
                  onChange={(event) => updateLocation(index, event.target.value)}
                  placeholder="Lagos Branch"
                  aria-label={`Branch ${index + 1}`}
                  className={cn(inputClassName, "flex-1")}
                />
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  aria-label={`Remove branch ${index + 1}`}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-light-gray transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addLocation}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add branch
        </button>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Save settings
        </button>
      </div>
    </form>
  );
}
