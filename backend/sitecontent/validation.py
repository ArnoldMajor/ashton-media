from dataclasses import dataclass
from decimal import Decimal

from PIL import Image, UnidentifiedImageError

# Pillow format name -> the name an editor knows it by.
ALLOWED_FORMATS = {"JPEG": "JPEG", "PNG": "PNG", "WEBP": "WebP"}

BYTES_PER_MB = 1024 * 1024

# Ratios stored in lowest terms that editors know by another name.
RATIO_LABELS = {(7, 3): "21:9"}


@dataclass(frozen=True)
class ImageSpec:
    """
    How a photo is used: the shape the site shows it at, and the two limits an
    upload has to meet (wide enough to stay sharp, small enough to load).

    The shape is not a rule. The public site crops every photo to fit with
    object-cover, so any shape is accepted and the editor judges the crop from
    the preview in the admin.
    """

    ratio_w: int
    ratio_h: int
    min_width: int
    max_mb: Decimal

    @property
    def ratio_label(self):
        return RATIO_LABELS.get((self.ratio_w, self.ratio_h), f"{self.ratio_w}:{self.ratio_h}")

    @property
    def max_mb_label(self):
        # "3" for 3.0, "1.5" for 1.5.
        return format(self.max_mb.normalize(), "f")

    @property
    def limits(self):
        """The two things an upload is checked against."""
        return f"at least {self.min_width} px wide · max {self.max_mb_label} MB"

    @property
    def line(self):
        return f"Shown at {self.ratio_label}, cropped to fit · {self.limits}"


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
    starts each sentence, e.g. "This slot allows files up to 3 MB."
    """
    facts = read_image(upload)
    if facts is None:
        return ["This file isn't an image we can read. Upload a JPEG, PNG or WebP file."]

    image_format, width, _height = facts
    problems = []

    if image_format not in ALLOWED_FORMATS:
        problems.append(f"Upload a JPEG, PNG or WebP file. Yours is a {image_format} file.")

    if upload.size > spec.max_mb * BYTES_PER_MB:
        problems.append(
            f"{subject} allows files up to {spec.max_mb_label} MB. Your file is {upload.size / BYTES_PER_MB:.2f} MB."
        )

    # Width is the sharpness guard. Height and shape are deliberately not
    # checked: the site crops to fit.
    if width < spec.min_width:
        problems.append(f"Upload a photo at least {spec.min_width} px wide. Yours is {width} px wide.")

    return problems
