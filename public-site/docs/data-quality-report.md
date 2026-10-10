# Billboard data quality report

Checked 2026-10-10 against `GET https://ashton-media.onrender.com/api/billboards/`
(4 records, all `format: digital`, `status: available`, `region: Dar es Salaam`).
Nothing in the backend was changed; these are findings for whoever maintains the
records in the Django admin.

## Summary

| Check                         | Result                 |
| ----------------------------- | ---------------------- |
| Records returned              | 4                      |
| Coordinates parse as numbers  | 4 of 4                 |
| Inside Tanzania bounds        | 4 of 4                 |
| Duplicate coordinate pairs    | **1 pair (2 records)** |
| Null dimensions               | **4 of 4**             |
| Empty `image`                 | 0 of 4                 |
| Image URL resolves (HTTP 200) | 4 of 4                 |

## Duplicate coordinates

| id | site_code   | name          | address                                      | latitude  | longitude |
| -- | ----------- | ------------- | -------------------------------------------- | --------- | --------- |
| 5  | DSM-DIG-001 | Palm Beach    | Ali Hassan Mwinyi Road, Obama Drive Junction | -6.798537 | 39.282172 |
| 6  | DSM-DIG-002 | Peugeot House | Ohio Road Junction                           | -6.798537 | 39.282172 |

The two records have different addresses but identical coordinates, so at least
one of them is wrong. On the map the two markers sit exactly on top of each
other and only one can be clicked. The network therefore shows at three
distinct points, not four, until this is corrected.

## Null dimensions

`width_meters` and `height_meters` are null on every record:

| id | name          |
| -- | ------------- |
| 5  | Palm Beach    |
| 6  | Peugeot House |
| 7  | Tanzanite     |
| 8  | Silicon Dar   |

The site hides the size wherever it is missing (cards show the region only and
the detail sheet drops its "Dimensions" row), so nothing renders as "null", but
no site currently shows a size.

## Empty images

None. All four records have an image and all four URLs return a PNG.

## Other observations

- **Image files are large.** Each is a 1.4–1.7 MB PNG. The site serves them
  through the Next.js image optimiser, so visitors get resized copies, but
  uploading JPEG or WebP would make the first optimisation of each faster.
- **Image filenames don't match two of the site names.** Tanzanite (id 7) uses
  `agakhan-roundabout.png` and Silicon Dar (id 8) uses `sayansi-junction.png`.
  This may simply be the junction each screen stands at; worth a glance to
  confirm the right photo is attached. Peugeot House (id 6) uses
  `peaugeot-house.png` (spelling).
- **`illuminated` and `backlit` are false on all four**, which is the model
  default. For LED screens this is probably unset rather than true-to-life.
- **`structure_code` and `side` are empty on all four.**
- **Status key spelling.** The model's choice is `under_maintanance`, labelled
  "Under Maintanance". No record uses it today, but the label would appear on
  the public site as spelled. The frontend mirrors the key as-is.
- **Only one format has records.** With no static, airport, station or light
  pole records, the format pages for those hide their site lists and the
  homepage network tiles show a descriptor in place of a count.
