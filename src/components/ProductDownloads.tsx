import { INDIVIDUAL_FILE_IDS, PRODUCT_FILES } from "@/lib/product-files";

export function ProductDownloads({ downloadUrl }: { downloadUrl: string }) {
  // The same expiring product authorization covers all five included files.
  // The API still checks the paid receipt on every individual download.
  return <div className="product-downloads">
    <a className="purchase-button" href={downloadUrl} referrerPolicy="no-referrer">DOWNLOAD COMPLETE PACK <span aria-hidden="true">↗</span></a>
    <p className="individual-downloads-label">Prefer individual files?</p>
    <ul className="individual-downloads" aria-label="Individual product downloads">
      {INDIVIDUAL_FILE_IDS.map((id) => <li key={id}>
        <a href={`${downloadUrl}&file=${id}`} referrerPolicy="no-referrer">
          <span>{PRODUCT_FILES[id].label}</span>
          <span className="download-format">{PRODUCT_FILES[id].format} <span aria-hidden="true">↓</span></span>
        </a>
      </li>)}
    </ul>
  </div>;
}
