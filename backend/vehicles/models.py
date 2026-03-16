from django.db import models

# Create your models here.
from clients.models import Cliente
class Vehiculo(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="vehiculos")
    patente = models.CharField(max_length=10, unique=True, db_index=True)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    color = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.patente} - {self.marca}"  # Agrega la marca al string de representación para facilitar la identificación del vehículo