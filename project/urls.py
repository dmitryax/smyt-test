from django.conf.urls import patterns, include, url
from django.contrib import admin

from rest_framework import viewsets, routers

from app.models import dynamic_models


admin.autodiscover()

# Registering REST Interface for the dynamic models
router = routers.DefaultRouter()
for model in dynamic_models:
    viewset = type(model.__name__ + 'ViewSet', (viewsets.ModelViewSet,), {'model': model})
    router.register(model.__name__.lower(), viewset)

urlpatterns = patterns('',    
    url(r'^$', 'app.views.index', name='index'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include(router.urls))
)
