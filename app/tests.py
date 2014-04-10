from datetime import date

from django.db import models
from django.core.urlresolvers import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from app.models import dynamic_models
from project.urls import API_PREFIX


class ApiTests(APITestCase):

    def setUp(self):
        self.models = dynamic_models

        self.test_data = {
            models.CharField: u'qwerty',
            models.IntegerField: 12345,
            models.DateField: date.today()
        }
        self.test_data2 = {
            models.CharField: u'poiuyt',
            models.IntegerField: 98765,
            models.DateField: date(2012,12,12)
        }

    def fill_tables(self):
        for Model in self.models:
            attrs = self.get_model_test_data(Model, self.test_data)
            instance = Model(**attrs)
            instance.save()
            yield Model, instance

    def get_model_fields(self, Model):
        return (f for f in Model._meta.fields if not f.primary_key)

    def get_model_test_data(self, Model, test_data_map):
        return {f.name: test_data_map[type(f)] for f in self.get_model_fields(Model)}

    def get_endpoint_url(self, collection, idx=None):
        id_str = '/%s' % idx if idx else ''
        return '/%s%s%s' % (API_PREFIX, collection.lower(), id_str)
        

    def test_get_request(self):
        for Model, instance in self.fill_tables():
            response = self.client.get(self.get_endpoint_url(Model.__name__))
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            test_data_instance = response.data[0]
            for key, value in test_data_instance.items():
                self.assertEqual(getattr(instance, key), value)


    def test_post_request(self):
        for Model in self.models:
            test_data = self.get_model_test_data(Model, self.test_data)

            url = self.get_endpoint_url(Model.__name__)
            response = self.client.post(url, test_data)

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            self.assertTrue(set(test_data.items()).issubset(response.data.items()))

            
    def test_put_request(self):
        for Model, instance in self.fill_tables():
            test_data = self.get_model_test_data(Model, self.test_data2)

            url = self.get_endpoint_url(Model.__name__, instance.id)
            response = self.client.put(url, test_data)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            self.assertTrue(set(test_data.items()).issubset(response.data.items()))