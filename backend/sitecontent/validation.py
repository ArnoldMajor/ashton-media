from dataclasses import dataclass
from decimal import Decimal

from PIL import Image, UnidentifiedImageError

# How far an upload's shape may be from the required ratio. The public site
# crops every photo with object-cover, so a near match loses only a sliver.
RATIO_TOLERANCE = 0.10

# Pillow format name -> the name an editor knows it by.
ALLOWED_FORMATS = {"JPEG": "JPEG", "PNG": "PNG", "WEBP": "WebP"}

BYTES_PER_MB = 1024 * 1024

# Ratios stored in lowest terms that editors know by another name.
RATIO_LABELS = {(7, 3): "21:9"}

# Shapes worth naming in an error message; anything else is given as "1.43:1".
COMMON_RATIOS = [
    (1, 1), (5, 4), (4, 3), (3, 2), (16, 10), (16, 9), (40, 21), (2, 1), (21, 9),
    (4, 5), (3, 4), (2, 3), (9, 16),
]


@dataclass(frozen=True)
class ImageSpec:
    """What an uploaded photo has to meet: shape, smallest size, largest file."""

    ratio_w: int
    ratio_h: int
    min_width: int
    min_height: int
    max_mb: Decimal

    @property
    def ratio_label(self):
        return RATIO_LABELS.get((self.ratio_w, self.ratio_h), f"{self.ratio_w}:{self.ratio_h}")

    @property
    def max_mb_label(self):
        # "3" for 3.0, "1.5" for 1.5.
        return format(self.max_mb.normalize(), "f")

    @property
    def line(self):
        return f"{self.ratio_label} · at least {self.min_width}×{self.min_height} · max {self.max_mb_label} MB"


def describe_ratio(width, height):
    """ "16:9" when the shape is a familiar one, otherwise "1.43:1". """
    actual = width / height
    for w, h in COMMON_RATIOS:
        if abs(actual / (w / h) - 1) < 0.01:
            return f"{w}:{h}"
    return f"{actual:.2f}:1"


def read_image(upload):
    """(format, width, height) of an uploaded file, or None if it isn't an image."""
    # forms.ImageField has already opened the file and left the result here.
    image = getattr(upload, "image", None)
    if image is None:
        try:
            upload.seek(0)
            image = Image.open(upload)
        except (UnidentifiedImageError, OSError):
            return None
        finally:
            upload.seek(0)
    return image.format, image.width, image.height


def upload_problems(spec, upload, subject="This slot"):
    """
    Everything wrong with a freshly uploaded file for this spec, as sentences
    an editor can act on. An empty list means the file is fine. `subject`
    starts each sentence, e.g. "This slot needs 4:3."
    """
    facts = read_image(upload)
    if facts is None:
        return ["This file isn't an image we can read. Upload a JPEG, PNG or WebP file."]

    image_format, width, height = facts
    problems = []

    if image_format not in ALLOWED_FORMATS:
        problems.append(f"Upload a JPEG, PNG or WebP file. Yours is a {image_format} file.")

    if upload.size > spec.max_mb * BYTES_PER_MB:
        problems.append(
            f"{subject} allows files up to {spec.max_mb_label} MB. Your file is {upload.size / BYTES_PER_MB:.2f} MB."
        )

    if width < spec.min_width or height < spec.min_height:
        problems.append(
            f"{subject} needs an image at least {spec.min_width}×{spec.min_height} pixels. Yours is {width}×{height}."
        )

    target = spec.ratio_w / spec.ratio_h
    if abs((width / height) / target - 1) > RATIO_TOLERANCE:
        problems.append(f"{subject} needs {spec.ratio_label}. Your image is {describe_ratio(width, height)}.")

    return problems
