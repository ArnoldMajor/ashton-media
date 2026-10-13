import type { Billboard } from "@/types/billboard";

/** Round-robin order. A format that isn't listed follows these, alphabetically. */
const FORMAT_ORDER: readonly string[] = ["static", "digital", "airport", "station", "light_pole"];

function formatRank(format: string): number {
  const rank = FORMAT_ORDER.indexOf(format);
  return rank === -1 ? FORMAT_ORDER.length : rank;
}

/** Moves the first `by` items to the end. `by` wraps around the list length. */
function rotate<T>(items: T[], by: number): T[] {
  if (items.length < 2) return items;
  const start = ((Math.trunc(by) % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

/**
 * Picks up to `count` sites that show a mix of formats instead of the first
 * few in API order. Pure: the same sites, count and seed always give the same
 * picks, so the caller decides when they change (the home page passes the UTC
 * day number).
 *
 * Each format's sites are queued with photos first, both parts in API order,
 * and the photo part is rotated by `seed`. The queues are then read one site
 * at a time in FORMAT_ORDER, round after round, so the formats interleave.
 *
 * With more formats than `count`, the first round can't reach them all, so
 * reading starts `seed` formats into the order and wraps around: each format
 * takes its turn at being the one left out.
 *
 * Both sides of one structure can be picked together: `Billboard` carries no
 * structure code to tell them apart.
 */
export function mixSites(sites: readonly Billboard[], count: number, seed: number): Billboard[] {
  const byFormat = new Map<string, Billboard[]>();
  for (const site of sites) {
    const group = byFormat.get(site.format);
    if (group) group.push(site);
    else byFormat.set(site.format, [site]);
  }

  const queues = [...byFormat.entries()]
    .sort(([a], [b]) => formatRank(a) - formatRank(b) || a.localeCompare(b))
    .map(([, group]) => [
      ...rotate(group.filter((site) => site.imageUrl), seed),
      ...group.filter((site) => !site.imageUrl),
    ]);

  const order = queues.length > count ? rotate(queues, seed) : queues;

  const picked: Billboard[] = [];
  const longest = Math.max(0, ...queues.map((queue) => queue.length));
  for (let round = 0; round < longest; round++) {
    for (const queue of order) {
      if (picked.length >= count) return picked;
      if (round < queue.length) picked.push(queue[round]);
    }
  }
  return picked;
}
