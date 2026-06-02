from rest_framework import serializers
from .models import Vehiculo
import re # Importamos el módulo de expresiones regulares para validar el formato de la patente

class VehiculoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    es_extranjero = serializers.BooleanField(write_only=True, default=False)
    class Meta:
        model = Vehiculo
        fields = '__all__'
        

    def validate_patente(self, value):
        value = value.replace(" ", "").upper()
        # Validar si ya existe (excluyendo el vehículo actual si es un update)
        exists = Vehiculo.objects.filter(patente=value).exists()
        if self.instance: # Si estamos editando
            exists = Vehiculo.objects.filter(patente=value).exclude(id=self.instance.id).exists()
        
        if exists:
            raise serializers.ValidationError("Este vehículo ya se encuentra registrado en el sistema.")

        return value

    def validate(self, data):
        patente = data.get("patente")
        es_extranjero = data.get("es_extranjero", False)

        if not patente:
            raise serializers.ValidationError({"patente": "La patente es obligatoria"})

        # Si NO es extranjero, validamos formato Argentino
        if not es_extranjero:
            # Formato viejo: 3 letras y 3 números (AAA123)
            formato_viejo = re.match(r'^[A-Z]{3}\d{3}$', patente)
            # Formato nuevo: 2 letras, 3 números, 2 letras (AA123BB)
            formato_nuevo = re.match(r'^[A-Z]{2}\d{3}[A-Z]{2}$', patente)

            if not (formato_viejo or formato_nuevo):
                raise serializers.ValidationError({
                    "patente": "El formato no corresponde a una patente Argentina (AAA123 o AA123BB). Si es extranjera, marque la casilla correspondiente."
                })
        else:
            # Validación mínima para extranjeros: Solo letras y números, largo razonable
            if not re.match(r'^[A-Z0-9]+$', patente) or len(patente) < 3:
                raise serializers.ValidationError({
                    "patente": "Patente extranjera inválida. Solo letras y números."
                })
        

        return data
    
    def validate_cliente(self, value):

        if not value:
            raise serializers.ValidationError(
                "Debe asignar un cliente al vehículo"
            )

        return value

    def create(self, validated_data):
        # Quitamos 'es_extranjero' de los datos validados 
        # para que no llegue al modelo Vehiculo()
        validated_data.pop('es_extranjero', None)
        
        # Ahora que está limpio, llamamos al método original para crear
        return super().create(validated_data)

    
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