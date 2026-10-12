"""
The fixed list of image slots on the public site.

This list is the source of truth: `manage.py sync_site_images` copies it into
the SiteImage table, and list position becomes the slot's `order`. To add,
reword or retire a slot, edit this file and deploy. Editors can't.

Keys are permanent. The public site looks images up by key, so renaming one
orphans the image uploaded under the old name.
"""
from decimal import Decimal

HERO = {
    "section": "Home",
    "ratio_w": 16, "ratio_h": 9,
    "min_width": 2560, "min_height": 1440,
    "max_mb": Decimal("3.0"),
    "alt_required": True,
}
HERO_NOTE = "On phones only the centre of the image is visible, so keep the main subject in the middle third."

TILE = {
    "section": "Home",
    "ratio_w": 3, "ratio_h": 4,
    "min_width": 1200, "min_height": 1600,
    "max_mb": Decimal("1.5"),
    "alt_required": False,
}
TILE_NOTE = "Keep the subject in the upper two thirds; the bottom third is covered by a dark gradient and the label."

# 21:9, stored in lowest terms.
BANNER = {
    "section": "Format pages",
    "ratio_w": 7, "ratio_h": 3,
    "min_width": 2400, "min_height": 1029,
    "max_mb": Decimal("3.0"),
    "alt_required": True,
}

# 1200×630, the size link previews are drawn at.
SHARE = {
    "section": "Site-wide",
    "ratio_w": 40, "ratio_h": 21,
    "min_width": 1200, "min_height": 630,
    "max_mb": Decimal("1.0"),
    "alt_required": False,
}


def _slot(spec, key, title, default_alt, note):
    return {**spec, "key": key, "title": title, "default_alt": default_alt, "note": note}


REGISTRY = [
    _slot(
        HERO, "home.hero.ooh",
        "Home → Hero slideshow → Slide 1 (Out-of-Home Advertising)",
        "Ashton Media out-of-home billboard",
        f'Full-screen background behind the headline "Make Your Brand Unmissable." {HERO_NOTE}',
    ),
    _slot(
        HERO, "home.hero.digital",
        "Home → Hero slideshow → Slide 2 (Digital Out-of-Home)",
        "Ashton Media digital LED screen",
        f'Full-screen background behind the headline "Dynamic. Bold. Always On." {HERO_NOTE}',
    ),
    _slot(
        HERO, "home.hero.airport",
        "Home → Hero slideshow → Slide 3 (Airport Advertising)",
        "Ashton Media airport advertising at JNIA",
        f'Full-screen background behind the headline "Own the Airport Experience." {HERO_NOTE}',
    ),

    _slot(
        TILE, "networks.static",
        "Home → Our Network → Static tile",
        "",
        f'Tile labelled "Static", links to /traditional. {TILE_NOTE}',
    ),
    _slot(
        TILE, "networks.digital",
        "Home → Our Network → Digital tile",
        "",
        f'Tile labelled "Digital", links to /digital. {TILE_NOTE}',
    ),
    _slot(
        TILE, "networks.airport",
        "Home → Our Network → Airport tile",
        "",
        f'Tile labelled "Airport", links to /airport. {TILE_NOTE}',
    ),
    _slot(
        TILE, "networks.station",
        "Home → Our Network → SGR (railway stations) tile",
        "",
        f'Tile labelled "SGR", links to /gallery. {TILE_NOTE}',
    ),

    _slot(
        BANNER, "traditional.banner",
        "Traditional OOH page → Top banner",
        "Traditional Billboard — Morogoro Road",
        'Shown with the caption "Traditional Billboard — Morogoro Road" over the bottom-left. '
        "Use a photo that matches the caption.",
    ),
    _slot(
        BANNER, "digital.banner",
        "Digital OOH page → Top banner",
        "Digital LED Screen — New Bagamoyo Road",
        'Shown with the caption "Digital LED Screen — New Bagamoyo Road". '
        "Use a photo that matches the caption.",
    ),
    _slot(
        BANNER, "airport.banner",
        "Airport Advertising page → Top banner",
        "JNIA Terminal 3",
        'Shown with the caption "JNIA Terminal 3". Use a photo that matches.',
    ),

    _slot(
        SHARE, "site.share",
        "Site-wide → Social share image (link previews)",
        "",
        "Shown when a page is shared on WhatsApp, Facebook, LinkedIn or X. "
        "Platforms crop the edges, so keep text and logos in the centre.",
    ),
]
