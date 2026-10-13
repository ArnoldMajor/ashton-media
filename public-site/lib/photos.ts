export const REAL_PHOTOS: string[] = [
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-2-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-3-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-4-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-5-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/slp-1144-copy.jpg",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/slp-1219-copy.jpg",
];

/**
 * Encoding quality for photographs. next/image's default of 75 visibly
 * softens billboard artwork. The value has to be listed under
 * `images.qualities` in next.config.ts, or Next falls back to the nearest
 * one that is.
 */
export const PHOTO_QUALITY = 90;

/**
 * How many times wider than its frame a photo is drawn when `object-cover`
 * crops it. A 16:9 photo in a 3:4 frame is scaled up to the frame's height,
 * so it is drawn 2.37× the frame's width. The `sizes` hint has to be
 * multiplied by this, or the browser downloads a file sized for the frame and
 * stretches it. 1 when the photo's size is unknown, or it is no wider than
 * the frame.
 */
export function coverScale(
  photo: { width: number | null; height: number | null } | null | undefined,
  frameRatio: number,
): number {
  if (!photo?.width || !photo?.height) return 1;
  return Math.max(1, photo.width / photo.height / frameRatio);
}
