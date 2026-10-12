from django import forms
from django.core.files.uploadedfile import UploadedFile
from django.utils.html import format_html

from sitecontent.previews import CROP_HELP
from sitecontent.validation import upload_problems
from .models import PHOTO_SPEC, CaseStudy

PHOTO_SUBJECT = "A case study photo"


class CaseStudyForm(forms.ModelForm):
    class Meta:
        model = CaseStudy
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Both are missing when the form is drawn read-only.
        if "brand" in self.fields:
            self.fields["brand"].help_text = (
                "Shown above the headline, and drawn in small capitals over the bottom-left corner of the photo."
            )
        if "image" in self.fields:
            self.fields["image"].help_text = format_html(
                "{}. JPEG, PNG or WebP.<br>{}<br>{}",
                PHOTO_SPEC.line,
                CROP_HELP,
                "The brand name sits over the bottom-left corner on a dark fade, "
                "so keep that corner clear of logos, faces and text.",
            )

    def clean(self):
        cleaned = super().clean()
        image = cleaned.get("image")

        # Only a file uploaded in this request is inspected. A stored one was
        # checked when it came in, and opening it again would download it from
        # R2 on every save.
        if isinstance(image, UploadedFile):
            problems = upload_problems(PHOTO_SPEC, image, subject=PHOTO_SUBJECT)
            if problems:
                self.add_error("image", problems)

        if cleaned.get("published"):
            # An upload that was just rejected already has its own message.
            if not image and "image" not in self.errors:
                self.add_error(
                    "image",
                    "A published case study needs a photo. Upload one, or untick Published to save it as a draft.",
                )
            if not cleaned.get("alt_text", "").strip():
                self.add_error(
                    "alt_text",
                    "A published case study needs alt text. Describe the photo in a few words.",
                )

        return cleaned
