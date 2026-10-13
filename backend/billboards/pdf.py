from django.template.loader import render_to_string
from weasyprint import HTML

REPORT_TEMPLATES = {
    "list": "billboards/availability_report.html",
    "detailed": "billboards/availability_report_detailed.html",
}

# The most sites one PDF may hold.
#
# The list is a text table, so its cap only has to be above the whole network.
#
# The detailed report is a page and a full-size photo per site. A JPEG goes
# into the PDF as it is, which costs almost nothing; a PNG is decoded and
# compressed again, about a quarter of a second each for a 2400x1600 photo on a
# laptop and several times that on the production server's fraction of a CPU,
# where the whole render has to fit inside gunicorn's 30-second timeout. 10
# keeps a set of PNG photos inside that. Raise it once a render has been timed
# on the live server.
MAX_SITES_LIST_PDF = 1000
MAX_SITES_DETAILED_PDF = 10


class TooManySitesError(Exception):
    """More sites were asked for than one report may hold. str() is a message fit to show the person."""


def check_site_count(count, report_type):
    """Raises TooManySitesError when `count` sites are more than a `report_type` report may hold."""
    if report_type == "detailed":
        if count > MAX_SITES_DETAILED_PDF:
            raise TooManySitesError(
                f"The detailed report can include up to {MAX_SITES_DETAILED_PDF} sites. "
                f"You selected {count}. Untick some sites or use the list report."
            )
    elif count > MAX_SITES_LIST_PDF:
        raise TooManySitesError(
            f"The list report can include up to {MAX_SITES_LIST_PDF} sites. "
            f"You selected {count}. Untick some sites or narrow the filters."
        )


def render_availability_pdf(billboards, start, end, report_type, base_url):
    """
    The availability report for `billboards` over [start, end], as PDF bytes.
    `report_type` is "detailed" for a page per site; anything else gives the
    list. `base_url` is what WeasyPrint resolves relative image URLs against.
    """
    template_name = REPORT_TEMPLATES["detailed" if report_type == "detailed" else "list"]
    html_string = render_to_string(template_name, {
        "billboards": billboards,
        "start": start,
        "end": end,
    })
    return HTML(string=html_string, base_url=base_url).write_pdf()
