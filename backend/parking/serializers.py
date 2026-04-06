from rest_framework import serializers
from .models import Estadia
from datetime import timedelta
from django.utils import timezone

class EstadiaSerializer(serializers.ModelSerializer): #Definición de un serializer para el modelo Estadia, que se utilizará para convertir instancias del modelo en formatos como JSON y viceversa.
    class Meta: #Clase interna que define la configuración del serializer.
        model = Estadia  #Especifica que este serializer se basa en el modelo Estadia.
        fields = '__all__'  #Indica que se deben incluir todos los campos del modelo Estadia en la serialización.
        read_only_fields = ['fecha_salida_estimada', 'activa']

    def create(self, validated_data):

        tipo = validated_data.get('tipo_estadia')
        cantidad = validated_data.get('cantidad')
        fecha_entrada = timezone.now()
        #fecha_entrada = validated_data.get('fecha_entrada')

        # calcular fecha de salida estimada
        if tipo == 'hora':
            fecha_salida_estimada = fecha_entrada + timedelta(hours=cantidad)

        elif tipo == 'dia':
            fecha_salida_estimada = fecha_entrada + timedelta(days=cantidad)

        elif tipo == 'mes':
            fecha_salida_estimada = fecha_entrada + timedelta(days=30)

        #else:fecha_salida_estimada = None
        validated_data["fecha_entrada"] = fecha_entrada
        validated_data['fecha_salida_estimada'] = fecha_salida_estimada
        validated_data["activa"] = True
        
        print("ENTRADA:", fecha_entrada)
        print("SALIDA ESTIMADA:", fecha_salida_estimada)
        return super().create(validated_data)

    def validate(self, data):

        vehiculo = data.get("vehiculo")

        if not vehiculo:
            raise serializers.ValidationError(
                "Debe seleccionar un vehículo"
            )

        existe_activa = Estadia.objects.filter(
            vehiculo=vehiculo,
            activa=True
        ).exists()

        if existe_activa:
            raise serializers.ValidationError(
                "Este vehículo ya tiene una estadía activa"
            )

        if data.get("tipo_estadia") == "hora" and data.get("cantidad") > 72:
            raise serializers.ValidationError(
                "No se permiten más de 72 horas"
            )

        if data.get("tipo_estadia") == "dia" and data.get("cantidad") > 30:
            raise serializers.ValidationError(
                "No se permiten más de 30 días"
            )
        return data
    
    def validate_tipo_estadia(self, value):

        tipos_validos = ["hora", "dia", "mes"]

        if value not in tipos_validos:
            raise serializers.ValidationError(
                "Tipo de estadía inválido"
            )

        return value
    
    def validate_cantidad(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "La cantidad debe ser mayor a 0"
            )

        if value > 1000:
            raise serializers.ValidationError(
                "Cantidad demasiado grande"
            )

        return value
    
    def validate_deuda(self, data):

        vehiculo = data.get("vehiculo")

        # buscar estadías anteriores con deuda
        estadias_con_deuda = Estadia.objects.filter(
            vehiculo=vehiculo,
            activa=False
        )

        for e in estadias_con_deuda:
            if e.deuda() > 0:
                raise serializers.ValidationError(
                    "El vehículo tiene deuda pendiente"
                )

        return data
    
    def update(self, instance, validated_data):

        # No permitir cambiar el vehículo de una estadía
        if "vehiculo" in validated_data:
            raise serializers.ValidationError(
                "No se puede cambiar el vehículo de una estadía"
            )

        # Permitir actualizar tipo_estadia y cantidad, pero recalcular fecha_salida_estimada
        tipo = validated_data.get("tipo_estadia", instance.tipo_estadia)
        cantidad = validated_data.get("cantidad", instance.cantidad)

        if tipo and cantidad:
            from datetime import timedelta

            if tipo == "hora":
                instance.fecha_salida_estimada = instance.fecha_entrada + timedelta(hours=cantidad)
            elif tipo == "dia":
                instance.fecha_salida_estimada = instance.fecha_entrada + timedelta(days=cantidad)
            elif tipo == "mes":
                instance.fecha_salida_estimada = instance.fecha_entrada + timedelta(days=30)

        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["patente"] = instance.vehiculo.patente
        data["cliente"] = instance.vehiculo.cliente.nombre
        data["deuda"] = instance.deuda()
        data["pagado"] = instance.pagado()

        return data