import urllib.request
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.storage import storages
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from casestudies.models import PHOTO_SPEC, CaseStudy, CaseStudyMetric
from sitecontent.validation import BYTES_PER_MB, read_image, size_problem

LEGACY_PHOTO_BASE = "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/"
DOWNLOAD_TIMEOUT_SECONDS = 30

# The four case studies that were hardcoded in
# public-site/app/case-studies/page.tsx (CASE_STUDIES), copied word for word.
# `format_label` is the text its format badge showed.
CASE_STUDIES = [
    {
        "brand": "Vodacom Tanzania",
        "format_label": "Digital",
        "headline": "15M+ Impressions in 30 Days",
        "description": (
            "A 4-screen digital network campaign across Dar es Salaam's CBD drove brand recall up 38% "
            "among the target demographic."
        ),
        "photo": "campaign-2-2x.png",
        "metrics": [("15M+", "impressions"), ("38%", "recall lift")],
    },
    {
        "brand": "CRDB Bank",
        "format_label": "Static",
        "headline": "Full-City Saturation Launch",
        "description": (
            "20-billboard roadside takeover across Dar es Salaam to support a new product launch — "
            "campaign reached 2.4M people over 8 weeks."
        ),
        "photo": "slp-1144-copy.jpg",
        "metrics": [("2.4M", "reach"), ("8 wks", "duration")],
    },
    {
        "brand": "Azam FC",
        "format_label": "Airport",
        "headline": "Terminal 3 Sponsorship",
        "description": (
            "Season-long airport takeover targeting arriving business travellers, positioning Azam as "
            "Tanzania's premium brand."
        ),
        "photo": "campaign-5-2x.png",
        "metrics": [("12", "positions"), ("365d", "campaign")],
    },
    {
        "brand": "Airtel Tanzania",
        "format_label": "Digital",
        "headline": "Dynamic Daypart Campaign",
        "description": (
            "Time-of-day targeted content on 8 LED screens — morning commute messages drove 24% higher "
            "response rate vs. static creative."
        ),
        "photo": "campaign-3-2x.png",
        "metrics": [("24%", "higher CTR"), ("8", "screens")],
    },
]


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "ashton-media-seed/1.0"})
    with urllib.request.urlopen(request, timeout=DOWNLOAD_TIMEOUT_SECONDS) as response:
        return response.read()


class Command(BaseCommand):
    help = (
        "Create the four case studies that used to be hardcoded on the public site. "
        "Skips any brand that already exists and never overwrites."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source-dir", type=Path,
            help="Read the photos from this folder (same file names) instead of downloading them.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Print the plan. Downloads nothing and writes nothing.",
        )
        parser.add_argument("--yes", action="store_true", help="Don't ask for confirmation.")

    def handle(self, *args, source_dir=None, dry_run=False, yes=False, **options):
        database = connection.settings_dict
        storage = storages["default"]
        self.stdout.write(f"Database: {database['NAME']} on {database['HOST'] or 'local socket'}")
        self.stdout.write(f"Storage:  {type(storage).__module__}.{type(storage).__qualname__}")
        self.stdout.write(f"Photos:   {source_dir or LEGACY_PHOTO_BASE}")
        self.stdout.write(f"Spec:     {PHOTO_SPEC.cap} (file size is reported, never blocking; pixel size is shown for information)")
        if dry_run:
            self.stdout.write("Dry run:  nothing is downloaded and nothing is written.")
        self.stdout.write("")

        existing = set(CaseStudy.objects.values_list("brand", flat=True))
        to_create = [entry for entry in CASE_STUDIES if entry["brand"] not in existing]

        if dry_run:
            self.print_plan(existing, source_dir)
            return

        if to_create and not yes:
            answer = input(f'Create {len(to_create)} case studies in the database above? Type "yes" to continue: ')
            if answer.strip() != "yes":
                self.stdout.write("Cancelled. Nothing was written.")
                return

        created = skipped = failed = 0
        for order, entry in enumerate(CASE_STUDIES, start=1):
            self.stdout.write(f"{order}. {entry['brand']}")
            if entry["brand"] in existing:
                self.stdout.write("   skipped: a case study with this brand already exists")
                skipped += 1
                continue

            try:
                data = self.read_photo(entry["photo"], source_dir)
            except OSError as error:
                self.stdout.write(self.style.ERROR(f"   FAILED: could not get {entry['photo']} ({error}). Not created."))
                failed += 1
                continue

            photo = ContentFile(data, name=entry["photo"])
            if not self.report_photo(photo):
                self.stdout.write(self.style.ERROR(f"   FAILED: {entry['photo']} is not an image. Not created."))
                failed += 1
                continue

            with transaction.atomic():
                study = CaseStudy(
                    brand=entry["brand"],
                    format_label=entry["format_label"],
                    headline=entry["headline"],
                    description=entry["description"],
                    alt_text=entry["brand"],
                    published=True,
                    order=order,
                )
                study.image = photo
                study.save()
                CaseStudyMetric.objects.bulk_create(
                    CaseStudyMetric(case_study=study, value=value, label=label, order=position)
                    for position, (value, label) in enumerate(entry["metrics"], start=1)
                )
            self.stdout.write(self.style.SUCCESS(
                f"   created: published, order {order}, {len(entry['metrics'])} metrics, photo at {study.image.name}"
            ))
            created += 1

        self.stdout.write("")
        self.stdout.write(f"Case studies: {created} created, {skipped} skipped, {failed} failed.")
        if failed:
            raise CommandError(f"{failed} case studies were not created because their photo could not be used.")

    def read_photo(self, filename, source_dir):
        if source_dir:
            return (source_dir / filename).read_bytes()
        return download(LEGACY_PHOTO_BASE + filename)

    def report_photo(self, photo):
        """Print the photo's pixel size and whether its file is within the cap. False if it isn't an image at all."""
        facts = read_image(photo)
        if facts is None:
            return False
        image_format, width, height = facts
        self.stdout.write(
            f"   photo: {photo.name}, {image_format}, {width}×{height}, {photo.size / BYTES_PER_MB:.2f} MB"
        )
        # File size is the only thing compared. The pixel size above is information.
        too_heavy = size_problem(PHOTO_SPEC, photo.size, subject="A case study photo")
        if too_heavy:
            self.stdout.write(self.style.WARNING(f"   spec:  WARNING {too_heavy}"))
        else:
            self.stdout.write("   spec:  OK")
        return True

    def print_plan(self, existing, source_dir):
        would_create = 0
        for order, entry in enumerate(CASE_STUDIES, start=1):
            self.stdout.write(f"{order}. {entry['brand']}")
            if entry["brand"] in existing:
                self.stdout.write("   would skip: a case study with this brand already exists")
                continue

            would_create += 1
            metrics = ", ".join(f"{value} {label}" for value, label in entry["metrics"])
            self.stdout.write(f"   would create: published, order {order}, alt text \"{entry['brand']}\"")
            self.stdout.write(f"   badge: {entry['format_label']} | headline: {entry['headline']}")
            self.stdout.write(f"   metrics: {metrics}")

            if not source_dir:
                self.stdout.write(f"   photo: would download {LEGACY_PHOTO_BASE}{entry['photo']}")
                continue
            # Local files can be checked without touching the network.
            try:
                photo = ContentFile((source_dir / entry["photo"]).read_bytes(), name=entry["photo"])
            except OSError as error:
                self.stdout.write(self.style.ERROR(f"   photo: MISSING {source_dir / entry['photo']} ({error})"))
                continue
            if not self.report_photo(photo):
                self.stdout.write(self.style.ERROR(f"   photo: {entry['photo']} is not an image"))

        self.stdout.write("")
        self.stdout.write(f"Dry run: {would_create} would be created, {len(CASE_STUDIES) - would_create} skipped.")
