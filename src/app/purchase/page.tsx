import { PurchaseForm } from "@/components/PurchaseForm";

export default async function PurchasePage({ searchParams }: { searchParams: Promise<{ mode?: string; status?: string }> }) {
  const params = await searchParams;
  return <PurchaseForm mode={params.mode === "recover" ? "recover" : "purchase"} status={params.status} />;
}
