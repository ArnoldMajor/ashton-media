/** How visitors reach the sales team. One place, so every button dials the same number. */
export const PHONE_DISPLAY = "+255 758 880 088";
export const PHONE_HREF = "tel:+255758880088";

const WHATSAPP_NUMBER = "255758880088";

export const DEFAULT_WHATSAPP_TEXT = "Hello Ashton Media, I'd like to plan a campaign.";

/** A wa.me link that opens a chat with `text` already typed in. */
export function whatsappHref(text: string = DEFAULT_WHATSAPP_TEXT): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
