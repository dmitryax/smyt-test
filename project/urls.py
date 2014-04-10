from django.conf.urls import patterns, include, url
from django.contrib import admin

from rest_framework import viewsets, routers

from app.models import dynamic_models


admin.autodiscover()

API_PREFIX = 'api/'

# Registering REST Interface for the dynamic models
router = routers.DefaultRouter(trailing_slash=False)
for model in dynamic_models:
    viewset = type(model.__name__ + 'ViewSet', (viewsets.ModelViewSet,), {'model': model})
    router.register(model.__name__.lower(), viewset)

urlpatterns = patterns('',    
    url(r'^$', 'app.views.index', name='index'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^%s' % API_PREFIX, include(router.urls))
)
