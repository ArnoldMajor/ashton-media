import csv
from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from billboards.models import Billboard

TRUE_VALUES = {"1", "true", "yes", "y"}


class Command(BaseCommand):
    help = "Import billboards from a CSV and attach images from a folder."

    def add_arguments(self, parser):
        parser.add_argument("csv_path")
        parser.add_argument("--images", help="Folder containing the image files")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--replace-images", action="store_true")

    def handle(self, csv_path, images=None, dry_run=False, replace_images=False, **kwargs):
        images_dir = Path(images) if images else None
        created = updated = 0
        errors = []

        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            for line_no, row in enumerate(csv.DictReader(f), start=2):
                code = row.get("site_code", "?").strip()
                try:
                    was_created = self.import_row(row, images_dir, dry_run, replace_images)
                except Exception as e:  # report per-row, keep going
                    errors.append(f"line {line_no} ({code}): {e}")
                    continue
                created += was_created
                updated += not was_created

        prefix = "[dry run] " if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{prefix}created {created}, updated {updated}"))
        for err in errors:
            self.stderr.write(self.style.ERROR(err))

    def import_row(self, row, images_dir, dry_run, replace_images):
        site_code = row["site_code"].strip()
        obj = Billboard.objects.filter(site_code=site_code).first()
        was_created = obj is None
        obj = obj or Billboard(site_code=site_code)

        obj.structure_code = row.get("structure_code", "").strip()
        obj.side = row.get("side", "").strip()
        obj.name = row["name"].strip()
        obj.format = row["format"].strip()
        obj.status = row.get("status", "").strip() or Billboard.Status.AVAILABLE
        obj.region = row["region"].strip()
        obj.address = row["address"].strip()
        obj.latitude = Decimal(row["latitude"])
        obj.longitude = Decimal(row["longitude"])
        obj.width_meters = Decimal(row["width_meters"])
        obj.height_meters = Decimal(row["height_meters"])
        obj.illuminated = row.get("illuminated", "").strip().lower() in TRUE_VALUES
        obj.backlit = row.get("backlit", "").strip().lower() in TRUE_VALUES
        obj.full_clean(exclude=["image"])  # validates choices and lengths like the API would

        image_path = None
        image_name = row.get("image_filename", "").strip()
        if image_name and images_dir and (replace_images or not obj.image):
            image_path = images_dir / image_name
            if not image_path.exists():
                raise FileNotFoundError(f"image not found: {image_name}")

        if not dry_run:
            obj.save()
            if image_path:
                with open(image_path, "rb") as img:
                    obj.image.save(image_path.name, File(img), save=True)
        return was_created
