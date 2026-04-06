from django.db import models

# Create your models here.
from parking.models import Estadia
class Pago(models.Model):
    METODOS = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
    ]
    estadia = models.ForeignKey(Estadia, on_delete=models.CASCADE, related_name='payments')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateTimeField(auto_now_add=True)
    metodo_pago = models.CharField(max_length=50)
    
    tipo = models.CharField(
    max_length=10,
    choices=[
        ("pago", "Pago"),
        ("reverso", "Reverso"),
    ],
    default="pago"
    )

    pago_original = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reversiones'
    )
    
    def __str__(self):
        return f"Pago {self.monto}- {self.metodo_pago}"