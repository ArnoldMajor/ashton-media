import type { Billboard, BillboardFormat } from "@/types/billboard";
import FormatBadge from "./FormatBadge";
import PhotoPlaceholder from "./PhotoPlaceholder";

/** Stock photo shown behind a billboard that has no image of its own. */
const STOCK_PHOTO: Partial<Record<BillboardFormat, number>> = { digital: 1, airport: 3 };

export function stockPhotoIndex(format: BillboardFormat): number {
  return STOCK_PHOTO[format] ?? 4;
}

/** "Dar es Salaam · 10 × 5 m" — skips whichever parts the backend left empty. */
export function billboardMeta(billboard: Billboard): string {
  return [billboard.region, billboard.size].filter(Boolean).join(" · ");
}

interface Props {
  billboard: Billboard;
  showBadge?: boolean;
}

/** Card contents only — the caller supplies the wrapping button or link. */
export default function BillboardCard({ billboard, showBadge = true }: Props) {
  const meta = billboardMeta(billboard);

  return (
    <>
      <PhotoPlaceholder ratio="16/9" overlay src={billboard.imageUrl} photoIndex={stockPhotoIndex(billboard.format)} />
      <div className="p-4">
        {showBadge && (
          <div className="mb-2.5"><FormatBadge format={billboard.format} label={billboard.formatLabel} small /></div>
        )}
        <h4 className="font-bold text-sm mb-1 tracking-[-0.3px]">{billboard.name}</h4>
        {meta && <p className="text-xs text-white/35">{meta}</p>}
      </div>
    </>
  );
}
