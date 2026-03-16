from rest_framework import serializers
from .models import Estadia

class EstadiaSerializer(serializers.ModelSerializer): #Definición de un serializer para el modelo Estadia, que se utilizará para convertir instancias del modelo en formatos como JSON y viceversa.
    class Meta: #Clase interna que define la configuración del serializer.
        model = Estadia  #Especifica que este serializer se basa en el modelo Estadia.
        fields = '__all__'  #Indica que se deben incluir todos los campos del modelo Estadia en la serialización.