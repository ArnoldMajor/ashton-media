# Locations API

Contract the frontend (`lib/locations.ts`) expects from the Django backend. The
frontend already works without this endpoint — see "Fallback behaviour" below —
so this can be built and deployed independently.

## Endpoint

```
GET /api/locations/
```

- Base URL comes from `NEXT_PUBLIC_API_URL` (e.g. `https://api.ashtonmedia.net`).
- No auth required — this is public marketing data.
- Only **published/active** locations should be returned; draft or archived
  sites should be filtered out server-side, not client-side.

## Response shape

Either a bare array, or a DRF-paginated object — the frontend handles both:

```jsonc
// Option A — bare array
[ { "id": 1, "name": "...", ... } ]

// Option B — DRF pagination
{ "count": 12, "next": null, "previous": null, "results": [ { "id": 1, ... } ] }
```

### Location object

```json
{
  "id": 1,
  "name": "New Bagamoyo Rd — Screen 01",
  "city": "Dar es Salaam",
  "format": "digital",
  "coordinates": [39.243, -6.759],
  "available": true,
  "size": "10×5m",
  "traffic": "85,000/day",
  "rate": "USD 2,400"
}
```

| Field         | Type                                            | Required | Notes                                                     |
| ------------- | ------------------------------------------------ | -------- | ---------------------------------------------------------- |
| `id`          | integer                                          | yes      | Stable, unique.                                             |
| `name`        | string                                           | yes      |                                                              |
| `city`        | string                                           | yes      | Used to cluster markers — keep spelling consistent (e.g. always "Dar es Salaam", not "Dar Es Salaam" some of the time). |
| `format`      | `"digital" \| "traditional" \| "airport"`        | yes      | Exactly one of these three strings. Anything else is dropped client-side. |
| `coordinates` | `[number, number]`                               | yes      | **`[longitude, latitude]`** — GeoJSON order, lng first. Must fall roughly within Tanzania (lng 29.3–40.5, lat -11.8 to -0.9) or the record is dropped and a warning logged. |
| `available`   | boolean                                          | yes      | Drives marker opacity, not colour.                          |
| `size`        | string                                           | no       | e.g. `"10×5m"`.                                              |
| `traffic`     | string                                           | no       | e.g. `"85,000/day"`.                                        |
| `rate`        | string                                           | no       | e.g. `"USD 2,400"`.                                          |

Any extra fields are ignored — no need to strip anything not listed here.

## Fallback behaviour

The frontend never renders empty or throws because this endpoint doesn't
exist yet or is down:

- `NEXT_PUBLIC_API_URL` unset → uses static sample data directly.
- Request fails, times out, or returns a non-2xx status → falls back to the
  same sample data and logs a warning.
- Response has zero usable records after validation → same fallback.

So this endpoint can ship whenever it's ready; nothing on the frontend needs
to change to pick it up — just set `NEXT_PUBLIC_API_URL` in the relevant
environment.

## Caching

The frontend calls this with `next: { revalidate: 300 }` (Next.js ISR) — so
it's fetched at most once every 5 minutes per deployment, not on every page
load. No special cache headers are required, but `Cache-Control` matching
that window (e.g. `max-age=300`) is welcome.

## Suggested Django model

```python
class Location(models.Model):
    FORMAT_CHOICES = [
        ("digital", "Digital"),
        ("traditional", "Traditional"),
        ("airport", "Airport"),
    ]

    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    available = models.BooleanField(default=True)
    size = models.CharField(max_length=50, blank=True)
    traffic = models.CharField(max_length=50, blank=True)
    rate = models.CharField(max_length=50, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["city", "name"]
```

If PostGIS is available, a `PointField(geography=True)` for
`latitude`/`longitude` is preferable (enables distance/bbox queries later) —
just make sure the serializer still emits plain `[lng, lat]`, not GeoJSON
Point objects, to match the contract above.

### DRF serializer

```python
class LocationSerializer(serializers.ModelSerializer):
    coordinates = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "name", "city", "format", "coordinates", "available", "size", "traffic", "rate"]

    def get_coordinates(self, obj):
        return [float(obj.longitude), float(obj.latitude)]


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Location.objects.filter(is_published=True)
    serializer_class = LocationSerializer
    pagination_class = None  # or a DRF pagination class — either shape works
```
