from django.db import models

# Create your models here.
from vehicles.models import Vehiculo
class Estadia(models.Model):
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    fecha_salida = models.DateTimeField(blank=True, null=True)

    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.vehiculo.patente} - {self.fecha_ingreso}"