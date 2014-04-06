import os

import yaml
import json

from django.db import models


def models_from_yaml(yaml_path):
    models_def = yaml.load(open(yaml_path, 'r'))
    return [get_model(name, val) for name, val in models_def.items()] 


def get_model(model_name, model_def):
    fields = {f['id']: get_model_field(f['title'], f['type']) for f in model_def['fields']}
    fields['__module__'] = __name__
    fields['Meta'] = type('Meta', (), {"verbose_name": model_def['title'],
                                       "verbose_name_plural": model_def['title']})
    fields["_schema_json"] = json.dumps(model_def['fields'])
    return type(model_name.capitalize(), (models.Model,), fields)


def get_model_field(field_title, field_type):
    fields_types_map = {
        'char': models.CharField(field_title, max_length=127),
        'int': models.IntegerField(field_title),
        'date': models.DateField(field_title),
    }
    return fields_types_map[field_type]


dynamic_models = models_from_yaml('%s/models.yaml' % os.path.dirname(__file__))

globals().update({model.__name__: model for model in dynamic_models})