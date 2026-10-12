from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from sitecontent import registry
from sitecontent.models import SiteImage


class Command(BaseCommand):
    help = "Create and update site image slots from sitecontent/registry.py. Safe to run on every deploy."

    @transaction.atomic
    def handle(self, *args, **options):
        entries = registry.REGISTRY
        keys = [entry["key"] for entry in entries]
        if len(keys) != len(set(keys)):
            raise CommandError("sitecontent/registry.py has a duplicate key.")

        existing = {slot.key: slot for slot in SiteImage.objects.all()}
        created = updated = 0

        for order, entry in enumerate(entries, start=1):
            # The registry describes the slot; it never carries image, alt_text
            # or updated_by, so those can't be touched below.
            described = {**entry, "order": order, "active": True}
            described.pop("key")
            slot = existing.get(entry["key"])

            if slot is None:
                SiteImage.objects.create(key=entry["key"], alt_text=entry["default_alt"], **described)
                created += 1
                continue

            changes = {field: value for field, value in described.items() if getattr(slot, field) != value}
            if changes:
                # update() rather than save(): it writes only these columns and
                # leaves updated_at meaning "when an editor last changed it".
                SiteImage.objects.filter(pk=slot.pk).update(**changes)
                updated += 1

        deactivated = SiteImage.objects.filter(active=True).exclude(key__in=keys).update(active=False)

        self.stdout.write(
            self.style.SUCCESS(f"Site images: {created} created, {updated} updated, {deactivated} deactivated.")
        )
