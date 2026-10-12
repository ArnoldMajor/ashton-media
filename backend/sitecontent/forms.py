from django import forms
from django.core.files.uploadedfile import UploadedFile
from django.utils.html import format_html

from .models import SiteImage
from .previews import PHOTO_HELP
from .validation import upload_problems


class SiteImageForm(forms.ModelForm):
    class Meta:
        model = SiteImage
        fields = ("image", "alt_text")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        slot = self.instance
        if not slot.pk:
            return
        self.fields["image"].help_text = format_html("{}. JPEG, PNG or WebP.<br>{}", slot.spec_line, PHOTO_HELP)
        self.fields["alt_text"].help_text = (
            "A few words describing the photo, for screen readers and search engines."
            if slot.alt_required
            else "Optional for this slot. Leave blank if the image is only decoration."
        )

    def clean(self):
        cleaned = super().clean()
        image = cleaned.get("image")

        # Only a file uploaded in this request is inspected. A stored one was
        # checked when it came in, and opening it again would download it from
        # R2 on every save.
        if isinstance(image, UploadedFile):
            problems = upload_problems(self.instance.image_spec, image)
            if problems:
                self.add_error("image", problems)

        if image and self.instance.alt_required and not cleaned.get("alt_text", "").strip():
            self.add_error("alt_text", "This slot needs alt text. Describe the photo in a few words.")

        return cleaned
