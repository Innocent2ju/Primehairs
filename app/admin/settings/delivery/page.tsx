import DeliverySettingsForm from "@/components/admin/forms/DeliverySettingsForm";
import { getDeliverySettings } from "@/lib/delivery-config";

export default async function DeliverySettingsPage() {
  const settings = await getDeliverySettings();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <DeliverySettingsForm settings={settings} />
    </div>
  );
}
