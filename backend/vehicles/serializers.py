from rest_framework import serializers
from .models import Vehiculo
import re # Importamos el módulo de expresiones regulares para validar el formato de la patente

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = '__all__'

    def validate_patente(self, value):

        value = value.replace(" ", "").upper()

        # Formato simple (letras y números)
        if not re.match(r'^[A-Z0-9]+$', value):
            raise serializers.ValidationError(
                "La patente solo puede contener letras y números"
            )

        # Longitud típica (Argentina suele ser 6-7)
        if len(value) < 6 or len(value) > 8:
            raise serializers.ValidationError(
                "La patente debe tener entre 6 y 8 caracteres"
            )

        return value
    
    def validate_cliente(self, value):

        if not value:
            raise serializers.ValidationError(
                "Debe asignar un cliente al vehículo"
            )

        return value

    def validate(self, data):

        if not data.get("patente"):
            raise serializers.ValidationError(
                "La patente es obligatoria"
            )

        return data
    
    def update(self, instance, validated_data):

        nuevo_cliente = validated_data.get("cliente")

    # SOLO validar si intenta cambiar cliente
        if nuevo_cliente and nuevo_cliente != instance.cliente:

            if instance.estadia_set.exists():
                raise serializers.ValidationError(
                    "No se puede cambiar el cliente de un vehículo con historial"
                )

        patente = validated_data.get("patente")

        if patente:
            validated_data["patente"] = patente.upper().strip()

        return super().update(instance, validated_data)