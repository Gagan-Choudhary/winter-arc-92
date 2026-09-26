type Entity = Record<string, unknown>;

export function matchesPaidPurchase(
  purchase: { purchaseId: string; paymentLinkId: string; email: string; amount: number; productId: string },
  link: Entity,
  payment: Entity,
): boolean {
  const customer = link.customer as Entity | undefined;
  return (
    purchase.productId === "winter-arc-92" && purchase.amount === 4900 &&
    link.id === purchase.paymentLinkId && link.reference_id === purchase.purchaseId &&
    link.status === "paid" && link.currency === "INR" && link.amount === 4900 &&
    link.amount_paid === 4900 && link.accept_partial === false &&
    typeof customer?.email === "string" && customer.email.trim().toLowerCase() === purchase.email &&
    typeof payment.id === "string" && /^pay_[A-Za-z0-9]+$/.test(payment.id) &&
    payment.status === "captured" && payment.captured === true &&
    payment.amount === 4900 && payment.currency === "INR"
  );
}
