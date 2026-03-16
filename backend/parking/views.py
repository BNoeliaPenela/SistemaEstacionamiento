from django.shortcuts import render

# Create your views here.
from rest_framework import generics #Importar la clase generics de Django REST Framework, que proporciona vistas genéricas para operaciones comunes como crear, listar, actualizar y eliminar objetos.
from rest_framework.views import APIView #Importar la clase APIView de Django REST Framework, que es una clase base para crear vistas basadas en clases que pueden manejar diferentes métodos HTTP (GET, POST, etc.).
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .models import Estadia
from .serializers import EstadiaSerializer
from .utils import calcular_precio_estadia

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


class VehiculosEstacionadosView(generics.ListAPIView):
    queryset = Estadia.objects.filter(activa=True)
    serializer_class = EstadiaSerializer

class EgresoVehiculoView(APIView): #Definición de una vista para registrar el egreso de un vehículo del estacionamiento utilizando la clase APIView, que permite manejar diferentes métodos HTTP. Esta vista se encargará de actualizar la estadía correspondiente al vehículo para marcarla como inactiva y calcular el precio de la estadía.

    def post(self, request): #Define un método post para manejar las solicitudes POST que se envían a esta vista. Este método se ejecutará cuando se intente registrar el egreso de un vehículo del estacionamiento.

        vehiculo_id = request.data.get("vehiculo")
        precio_manual = request.data.get("precio")#Permite ingresar un precio manual para la estadía, en caso de que se quiera establecer un precio específico en lugar de calcularlo automáticamente. Este valor es opcional y se puede proporcionar en la solicitud.

        try:
            estadia = Estadia.objects.get(
                vehiculo=vehiculo_id,
                activa=True
            )
        except Estadia.DoesNotExist:
            return Response(
                {"error": "El vehículo no tiene una estadía activa"},
                status=status.HTTP_400_BAD_REQUEST
            )

        estadia.fecha_salida = datetime.now()
        estadia.activa = False

        # precio manual
        if precio_manual:
            estadia.precio = precio_manual

        # fallback para futuro automático
        else:
            estadia.precio = calcular_precio_estadia(estadia)

        estadia.save()

        return Response({
            "mensaje": "Egreso registrado correctamente",
            "precio": estadia.precio
        })