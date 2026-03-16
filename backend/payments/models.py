from django.db import models

# Create your models here.
from parking.models import Estadia
class Pago(models.Model):
    estadia = models.OneToOneField(Estadia, on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateTimeField(auto_now_add=True)
    metodo_pago = models.CharField(max_length=50)

    def __str__(self):
        return f"Pago {self.monto}"