import urllib.request
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.storage import storages
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from sitecontent.models import SiteImage
from sitecontent.validation import BYTES_PER_MB, RATIO_TOLERANCE, read_image, upload_problems

LEGACY_PHOTO_BASE = "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/"
DOWNLOAD_TIMEOUT_SECONDS = 30

# The photo the public site shows in each slot today (slot key -> legacy file).
# The four networks.* tiles and site.share are left out on purpose: the site
# has no photo for them, so they stay empty.
SLOT_PHOTOS = {
    "home.hero.ooh": "slp-1144-copy.jpg",
    "home.hero.digital": "campaign-2-2x.png",
    "home.hero.airport": "campaign-5-2x.png",
    "traditional.banner": "slp-1144-copy.jpg",
    "digital.banner": "campaign-2-2x.png",
    "airport.banner": "campaign-5-2x.png",
}

FILLED = "filled"
REPLACED = "replaced"
SKIPPED = "skipped"
FAILED = "failed"

NO_VALUE = "—"


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "ashton-media-seed/1.0"})
    with urllib.request.urlopen(request, timeout=DOWNLOAD_TIMEOUT_SECONDS) as response:
        return response.read()


def describe_storage(storage):
    """Class path of a storage backend, with its bucket when it has one (S3, R2)."""
    name = f"{type(storage).__module__}.{type(storage).__qualname__}"
    bucket = getattr(storage, "bucket_name", None)
    return f"{name} (bucket: {bucket})" if bucket else name


class Command(BaseCommand):
    help = (
        "Fill empty site image slots with the photos the public site uses today. "
        "Never replaces an image that is already set unless --force is given."
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
        parser.add_argument("--force", action="store_true", help="Replace images that are already set.")
        parser.add_argument("--yes", action="store_true", help="Don't ask for confirmation.")

    def handle(self, *args, source_dir=None, dry_run=False, force=False, yes=False, **options):
        database = connection.settings_dict
        self.stdout.write(f"Database: {database['NAME']} on {database['HOST'] or 'local socket'}")
        self.stdout.write(f"Storage:  {describe_storage(storages['default'])}")
        self.stdout.write(f"Photos:   {source_dir or LEGACY_PHOTO_BASE}")
        self.stdout.write(
            f"Spec:     each photo is compared with its slot (ratio within {RATIO_TOLERANCE:.0%}); "
            "shortfalls are reported, never blocking"
        )
        if force:
            self.stdout.write(self.style.WARNING("Force:    slots that already have an image WILL BE REPLACED."))
        if dry_run:
            self.stdout.write("Dry run:  nothing is downloaded and nothing is written.")
        self.stdout.write("")

        slots = {slot.key: slot for slot in SiteImage.objects.filter(key__in=SLOT_PHOTOS)}
        pending = [key for key in SLOT_PHOTOS if key in slots and (force or not slots[key].image)]
        replacing = [key for key in pending if slots[key].image]

        if pending and not dry_run and not yes:
            question = f"Fill {len(pending)} slots"
            if replacing:
                question += f", REPLACING {len(replacing)} existing images,"
            answer = input(f'{question} in the database above? Type "yes" to continue: ')
            if answer.strip() != "yes":
                self.stdout.write("Cancelled. Nothing was written.")
                return

        photos = {}  # file name -> bytes, or the error that stopped us getting it
        rows = [
            self.seed_slot(key, filename, slots.get(key), photos, source_dir, dry_run, force)
            for key, filename in SLOT_PHOTOS.items()
        ]

        self.print_table(rows, dry_run)

        failed = sum(row["result"] == FAILED for row in rows)
        if failed:
            raise CommandError(f"{failed} of {len(rows)} slots failed. See the table above.")

    def seed_slot(self, key, filename, slot, photos, source_dir, dry_run, force):
        row = {"key": key, "file": filename, "result": FAILED, "size": NO_VALUE, "notes": []}

        if slot is None:
            row["notes"] = ["no row in the database: run `python manage.py sync_site_images` first"]
            return row

        had_image = bool(slot.image)
        if had_image and not force:
            row["result"] = SKIPPED
            row["size"] = f"{slot.image_width}×{slot.image_height}"
            row["notes"] = ["already has an image, left alone"]
            return row

        result = REPLACED if had_image else FILLED

        # A dry run may read local files, but never the network.
        if dry_run and not source_dir:
            row["result"] = result
            row["notes"] = ["not checked: a dry run doesn't download"]
            return row

        try:
            data = self.photo_bytes(filename, photos, source_dir)
        except OSError as error:
            row["notes"] = [f"could not get {filename} ({error})"]
            return row

        photo = ContentFile(data, name=filename)
        facts = read_image(photo)
        if facts is None:
            row["notes"] = [f"{filename} is not an image we can read"]
            return row

        _, width, height = facts
        row["size"] = f"{width}×{height}"
        row["notes"] = upload_problems(slot.image_spec, photo) or [f"OK ({len(data) / BYTES_PER_MB:.2f} MB)"]
        row["result"] = result

        if dry_run:
            return row

        previous = slot.image.name if had_image else None
        slot.image.save(filename, ContentFile(data), save=False)
        if slot.alt_required and not slot.alt_text.strip():
            slot.alt_text = slot.default_alt
        # Only the image and, at most, the alt text. updated_by and updated_at
        # stay as they were: they record what an editor did.
        slot.save(update_fields=["image", "image_width", "image_height", "alt_text"])

        if previous:
            self.stdout.write(self.style.WARNING(f"REPLACED {key}: was {previous}, now {slot.image.name}"))
        else:
            self.stdout.write(f"filled {key} with {slot.image.name}")
        return row

    def photo_bytes(self, filename, photos, source_dir):
        """Each source file is fetched once; slots that share it reuse the bytes."""
        if filename not in photos:
            try:
                photos[filename] = (
                    (source_dir / filename).read_bytes() if source_dir else download(LEGACY_PHOTO_BASE + filename)
                )
            except OSError as error:
                photos[filename] = error
        if isinstance(photos[filename], OSError):
            raise photos[filename]
        return photos[filename]

    def print_table(self, rows, dry_run):
        def label(result):
            return {
                FILLED: "would fill", REPLACED: "would replace", SKIPPED: "would skip", FAILED: "would fail",
            }[result]

        table = [
            (row["key"], row["file"], label(row["result"]) if dry_run else row["result"], row["size"], row["notes"])
            for row in rows
        ]
        headers = ("Slot", "Source file", "Result", "Pixels", "Spec check")
        widths = [max(len(headers[i]), *(len(line[i]) for line in table)) for i in range(4)]

        def line(cells, note):
            return "  ".join(cell.ljust(width) for cell, width in zip(cells, widths)) + "  " + note

        if not dry_run:
            self.stdout.write("")  # after the per-slot progress lines
        self.stdout.write(line(headers[:4], headers[4]))
        self.stdout.write(line(["-" * width for width in widths], "-" * len(headers[4])))
        for *cells, notes in table:
            self.stdout.write(line(cells, notes[0]))
            for note in notes[1:]:
                self.stdout.write(line([""] * 4, note))

        counts = {result: sum(row["result"] == result for row in rows) for result in (FILLED, REPLACED, SKIPPED, FAILED)}
        self.stdout.write("")
        verb = "would be filled" if dry_run else "filled"
        self.stdout.write(
            f"Site images: {counts[FILLED] + counts[REPLACED]} {verb} ({counts[REPLACED]} replacing an existing image), "
            f"{counts[SKIPPED]} skipped, {counts[FAILED]} failed."
        )
