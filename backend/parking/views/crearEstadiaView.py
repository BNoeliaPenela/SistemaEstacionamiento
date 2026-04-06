from django.shortcuts import render

# Create your views here.
from rest_framework import generics #Importar la clase generics de Django REST Framework, que proporciona vistas genéricas para operaciones comunes como crear, listar, actualizar y eliminar objetos.
from rest_framework.views import APIView #Importar la clase APIView de Django REST Framework, que es una clase base para crear vistas basadas en clases que pueden manejar diferentes métodos HTTP (GET, POST, etc.).
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from django.utils import timezone
from ..models import Estadia
from payments.models import Pago
from vehicles.models import Vehiculo
from ..serializers import EstadiaSerializer
from ..utils import calcular_precio_estadia

class CrearEstadiaView(generics.CreateAPIView): #Definición de una vista para crear una nueva estadía utilizando la clase CreateAPIView, que maneja la lógica para crear un nuevo objeto a partir de los datos proporcionados en la solicitud.
    queryset = Estadia.objects.all()
    serializer_class = EstadiaSerializer

    def create(self, request, *args, **kwargs):

        vehicle = request.data.get("vehiculo")

        # validar doble estacionamiento
        if Estadia.objects.filter(vehiculo_id=vehicle, activa=True).exists():
            return Response(
                {"error": "Vehículo ya estacionado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        return super().create(request, *args, **kwargs)


