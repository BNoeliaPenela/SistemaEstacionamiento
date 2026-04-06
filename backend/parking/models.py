from django.utils import timezone
from django.db import models
from django.db.models import Q
from vehicles.models import Vehiculo
class Estadia(models.Model):

    TIPO_ESTADIA = [ 
        ("default", "Seleccionar duración"),
        ('hora', 'Por hora'),
        ('dia', 'Por día'),
        ('mes', 'Por mes'),
        
    
    ]

    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE)
    fecha_entrada = models.DateTimeField(default=timezone.now)
    fecha_salida_estimada = models.DateTimeField(null=True, blank=True)
    fecha_salida_real = models.DateTimeField(blank=True, null=True)
    tipo_estadia = models.CharField(max_length=10, choices=TIPO_ESTADIA, default="default")
    cantidad = models.IntegerField(null=True, blank=True)

    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.vehiculo.patente} - {self.fecha_entrada}"
    # TOTAL PAGADO
    def total_pagado(self):
        return sum(p.monto for p in self.payments.all()) 

    # DEUDA
    def deuda(self):

        
        pagos = self.payments.all()

        for p in pagos:
            print("PAGO:", p.monto, "TIPO:", p.tipo)

        total_pagado = sum(p.monto for p in pagos)
        precio = self.precio or 0

        print("PRECIO:", precio)
        print("TOTAL PAGADO:", total_pagado)

        return max(precio - total_pagado, 0)
    
    def pagado(self):

        return self.deuda() == 0  and self.precio is not None  

    def estado_alerta(self):

        ahora = timezone.now()

        if not self.fecha_salida_estimada:
            return "sin_fecha"

        restante = self.fecha_salida_estimada - ahora

        # VENCIDO
        if restante.total_seconds() <= 0:
            return "vencido"

        # POR VENCER SEGÚN TIPO
        if self.tipo_estadia == "hora":
            if restante.total_seconds() <= 7200:  # 2 horas
                return "por_vencer"

        elif self.tipo_estadia == "dia":
            if restante.days <= 1:
                return "por_vencer"

        elif self.tipo_estadia == "mes":
            if restante.days <= 2:
                return "por_vencer"

        print("AHORA:", timezone.now())
        print("SALIDA ESTIMADA:", self.fecha_salida_estimada)
        # TODO OK
        return "ok"
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['vehiculo'],
                condition=Q(activa=True),
                name='unique_active_estadia_per_vehicle'
            )
        ]
    

class EstadiaConfig(models.Model):
    total_espacios = models.IntegerField()

    def __str__(self):
        return f"Espacios: {self.total_espacios}"

    