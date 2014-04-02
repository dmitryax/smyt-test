from django.contrib import admin

from app.models import dynamic_models


for model in dynamic_models:
    admin.site.register(model)