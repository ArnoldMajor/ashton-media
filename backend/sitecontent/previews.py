from django.utils.html import format_html

# Shown under every photo field. The site never rejects a photo for its shape
# or its pixel size; this is how an editor finds out what it will look like.
PHOTO_HELP = (
    "The site crops this photo to fit. Check the preview. A bigger photo looks sharper. "
    "If something important is cut off or it looks soft, upload a better one."
)

# A tall modern phone screen held upright. Full-screen photos are cropped to
# this on a phone, which keeps only a narrow strip of a landscape photo.
PHONE_RATIO = (9, 19.5)


def _cropped(caption, url, ratio, modifier=""):
    # The box takes the shape and object-fit: cover does the rest, exactly as
    # the public site draws it. Styles are in static/css/admin-overrides.css.
    return format_html(
        '<figure class="photo-preview{}">'
        "<figcaption>{}</figcaption>"
        '<div class="photo-preview__frame" style="aspect-ratio: {} / {};"><img src="{}" alt=""></div>'
        "</figure>",
        modifier, caption, ratio[0], ratio[1], url,
    )


def is_stored(photo):
    """
    True when the field holds a file that is already in storage. After a failed
    save the form leaves the just-uploaded, unsaved file on the object, and
    that has no URL to preview.
    """
    return bool(photo) and getattr(photo, "_committed", True)


def photo_size_text(width, height):
    """ "1600 × 900" for a photo whose pixel size is known, otherwise "". Information only, never a check. """
    return f"{width} × {height}" if width and height else ""


def photo_previews(url, alt, width, height, ratio, phone=False):
    """
    The stored photo three ways for the admin change form: as uploaded (with
    its pixel size, when known), cropped to the shape the site shows it at
    (`ratio`, a (w, h) pair), and, for full-screen placements, cropped to a
    phone screen.
    """
    size = photo_size_text(width, height)
    original = format_html(
        '<figure class="photo-preview">'
        "<figcaption>Your photo</figcaption>"
        '<a href="{0}" target="_blank" rel="noopener"><img class="photo-preview__original" src="{0}" alt="{1}"></a>'
        "{2}"
        "</figure>",
        url, alt,
        format_html('<div class="photo-preview__meta">Current photo: {} px</div>', size) if size else "",
    )
    return format_html(
        '<div class="photo-previews">{}{}{}</div>',
        original,
        _cropped("How it appears on the site", url, ratio),
        _cropped("On a phone", url, PHONE_RATIO, " photo-preview--phone") if phone else "",
    )


def without_preview(fieldsets):
    """The same fieldsets with the `preview` row left out, for an object that has no photo to preview."""
    return [
        (name, {**options, "fields": [field for field in options["fields"] if field != "preview"]})
        for name, options in fieldsets
    ]
