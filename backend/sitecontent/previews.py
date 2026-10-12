from django.utils.html import format_html

# Shown under every photo field. The site never rejects a photo for its shape;
# this is how an editor finds out what the crop does to it.
CROP_HELP = (
    "The site crops this photo to fit. Check the preview below. "
    "If something important is cut off, adjust the photo and upload it again."
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


def photo_previews(url, alt, width, height, ratio, phone=False):
    """
    The stored photo three ways for the admin change form: as uploaded, cropped
    to the shape the site shows it at (`ratio`, a (w, h) pair), and, for
    full-screen placements, cropped to a phone screen.
    """
    original = format_html(
        '<figure class="photo-preview">'
        "<figcaption>Your photo</figcaption>"
        '<a href="{0}" target="_blank" rel="noopener"><img class="photo-preview__original" src="{0}" alt="{1}"></a>'
        '<div class="photo-preview__meta">{2}×{3} pixels</div>'
        "</figure>",
        url, alt, width, height,
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
