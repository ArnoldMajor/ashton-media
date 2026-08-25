from django.contrib import admin
from .models import Notification, PushSubscription

# Register your models here.
admin.site.register(Notification)
admin.site.register(PushSubscription)