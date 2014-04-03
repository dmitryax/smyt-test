from django.shortcuts import render

from app.models import dynamic_models


def index(request):
    models = ((model.__name__, model._meta.verbose_name) for model in dynamic_models)
    return render(request, 'index.html', {'models': models})