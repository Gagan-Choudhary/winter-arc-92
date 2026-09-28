import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/customer-auth";
import { downloadPath } from "@/lib/delivery";
import { getEntitlement } from "@/lib/payment-store";
import { ProductDownloads } from "@/components/ProductDownloads";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const token = (await cookies()).get("wa92-access")?.value || "";
  const key = verifyAccessToken("session", token, process.env.ACCESS_TOKEN_SECRET || "");
  let owned = null;
  try { owned = key ? await getEntitlement(key) : null; }
  catch (error) { console.error("Unable to load customer entitlement", error); }
  const download = owned?.paymentId ? downloadPath(owned.paymentId) : "";
  return <main className="success-page"><div className="success-panel">
    <a className="brand" href="/" aria-label="Winter Arc home"><span className="brand-star">✦</span> WINTER ARC <b>92</b></a>
    {owned && download ? <>
      <p className="eyebrow">PURCHASE VERIFIED</p>
      <h1>You already own Winter Arc 92.</h1>
      <p className="success-subtitle">Your Winter Arc starts now.</p>
      <p className="access-email">Purchase linked to: <strong>{owned.email}</strong></p>
      <ProductDownloads downloadUrl={download} />
      <p className="success-note">These download links expire in 15 minutes. Request a new access email whenever you need another download.</p>
    </> : <>
      <p className="eyebrow">SECURE ACCESS</p>
      <h1>Verify your email to continue.</h1>
      <p className="success-subtitle">Your access session expired or could not be verified.</p>
      <a className="purchase-button" href="/purchase?mode=recover">GET MY DOWNLOAD <span aria-hidden="true">↗</span></a>
    </>}
    <a className="success-home" href="/">BACK TO WINTER ARC</a>
  </div></main>;
}
