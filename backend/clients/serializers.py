from rest_framework import serializers 
from .models import Cliente
from rest_framework.response import Response

class ClienteSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Cliente
        fields = '__all__'
    
    def validate_nombre(self, value):
        if not value.replace(" ", "").isalpha():
            raise serializers.ValidationError(
                "El nombre solo debe contener letras"
            )

        return value.title()
    
    def validate_dni(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "El DNI debe contener solo números"
            )

        if len(value) < 7 or len(value) > 10:
            raise serializers.ValidationError(
                "El DNI debe tener entre 7 y 10 dígitos"
            )

        return value
    
    def validate_telefono(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "El teléfono debe contener solo números"
            )

        if len(value) < 8:
            raise serializers.ValidationError(
                "El teléfono es demasiado corto"
            )

        return value
    
    def validate(self, data):
        print(data)
        if not data.get("nombre"):
            raise serializers.ValidationError(
                "El nombre es obligatorio"
            )

        if not data.get("dni"):
            raise serializers.ValidationError(
                "El DNI es obligatorio"
            )

        return data
    
    


