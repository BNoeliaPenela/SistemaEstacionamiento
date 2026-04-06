from rest_framework import serializers
from .models import Pago

class PagoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Pago
        fields = "__all__"

    def validate_monto(self, value):

        if value == 0:
            raise serializers.ValidationError("El monto no puede ser 0")
        
        if value > 1000000:
            raise serializers.ValidationError(
                "Monto demasiado alto"
            )

        return value
    
    def validate_metodo(self, value):

        metodos_validos = ["efectivo", "tarjeta", "transferencia"]

        if value not in metodos_validos:
            raise serializers.ValidationError(
                "Método de pago inválido"
            )

        return value
    
    def validate_estadia(self, value):

        if not value:
            raise serializers.ValidationError(
                "Debe asociar el pago a una estadía"
            )

        return value
    
    def validate(self, data):

        estadia = data.get("estadia")
        monto = data.get("monto")
        if monto <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")

        if not estadia.activa:
            raise serializers.ValidationError(
                "No se pueden registrar pagos en una estadía finalizada"
            )
        
        if estadia and monto:

            deuda = estadia.deuda()
            ya_pago = estadia.payments.exists()

            if monto <= 0:
                raise serializers.ValidationError(
                    "El monto debe ser mayor a 0"
                )

           
            return data
    
    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["patente"] = instance.estadia.vehiculo.patente
        data["cliente"] = instance.estadia.vehiculo.cliente.nombre
        data["tipo"] = instance.tipo
        data["es_reverso"] = instance.tipo == "reverso"

        return data
    