from django.shortcuts import render

# Create your views here.
from rest_framework import generics #Importar la clase generics de Django REST Framework, que proporciona vistas genéricas para operaciones comunes como crear, listar, actualizar y eliminar objetos.
from rest_framework.response import Response
from rest_framework import status
from .models import Estadia
from .serializers import EstadiaSerializer

class CrearEstadiaView(generics.CreateAPIView): #Definición de una vista para crear una nueva estadía utilizando la clase CreateAPIView, que maneja la lógica para crear un nuevo objeto a partir de los datos proporcionados en la solicitud.
    queryset = Estadia.objects.all()#Especifica el conjunto de datos que se utilizará para esta vista, en este caso, todas las instancias del modelo Estadia.
    serializer_class = EstadiaSerializer #Indica que se utilizará el serializer EstadiaSerializer para validar y serializar los datos de entrada y salida de esta vista.
    def create(self, request, *args, **kwargs): #Sobrescribe el método create para agregar lógica personalizada antes de crear una nueva estadía. Este método se ejecuta cuando se recibe una solicitud POST para crear una nueva estadía.
        vehiculo = request.data.get("vehiculo")

        if Estadia.objects.filter(vehiculo=vehiculo, activa=True).exists():
            return Response(
                {"error": "Este vehículo ya está estacionado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)#Llama al método create de la clase base para continuar con el proceso de creación de la estadía si no hay un vehículo activo con el mismo número de placa.


class ListarEstadiasView(generics.ListAPIView):
    queryset = Estadia.objects.all()
    serializer_class = EstadiaSerializer