# Billboards API

How the public site reads billboard data from the Django backend
(`backend/billboards/`). The code lives in `lib/api/`.

## Endpoint

```
GET {NEXT_PUBLIC_API_URL}/api/billboards/
```

Public, no auth. Returns a bare array today; `unwrapList` also accepts a
DRF-paginated `{ count, next, previous, results }` object.

## Two types

- `BillboardAPI` (`types/billboard.ts`) is exactly what the API sends.
- `Billboard` is what pages and components use. `adaptBillboard` converts one to
  the other and is the only place that reads raw API fields.

| API field                         | `Billboard` field       | Notes |
| --------------------------------- | ----------------------- | ----- |
| `latitude`, `longitude` (strings) | `coordinates`           | Parsed to numbers, `[lng, lat]`. A record is dropped with a warning if either is not a number or falls outside Tanzania (lng 29.3–40.5, lat -11.8 to -0.9). |
| `format`, `format_display`        | `format`, `formatLabel` | `format` is one of the Django `Billboard.Format` keys, or `"other"` for a key the frontend doesn't know yet. `formatLabel` is always what the API sent. |
| `status`, `status_display`        | `status`, `statusLabel`, `isAvailable` | `isAvailable` is `status === "available"`. |
| `width_meters`, `height_meters`   | `size`                  | `"10 × 5 m"` when both are present, otherwise `null`. |
| `image`                           | `imageUrl`              | `null` when empty. The R2 host must be listed in `next.config.ts`. |

## Fallback and caching

`getBillboardsResult()` never throws. If `NEXT_PUBLIC_API_URL` is unset, the
request fails or times out (45s, to sit through a Render cold start), or no
record survives validation, it returns the sample sites in `lib/data.ts` with
`source: "fallback"`, and the map shows a small "Showing sample data" notice.

Responses are cached with `next: { revalidate: 300 }`. Pages are prerendered and
refreshed in the background, so a cold backend delays a refresh, not a visitor.

## Map

The map keeps its own `Location` type. `billboardToLocation` in
`lib/locations.ts` is the only bridge between the two.
