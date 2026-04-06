from django.shortcuts import render
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework import generics
from django.db.models import Q
from .models import Vehiculo
from .serializers import VehiculoSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from parking.models import Estadia
from django.utils import timezone


class VehicleCreateView(generics.CreateAPIView):
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer

class VehicleByPlateView(APIView):


    def get(self, request):

        patente = request.query_params.get("patente")

        try:
            vehicle = Vehiculo.objects.get(patente=patente)
        except Vehiculo.DoesNotExist:
            return Response({"exists": False})

        return Response({
            "exists": True,
            "vehicle": VehiculoSerializer(vehicle).data
        })

class VehiculosListView(APIView):


    def get(self, request):

        search = request.GET.get("search")

        vehiculos = Vehiculo.objects.all()

        if search:
            vehiculos = vehiculos.filter(
                Q(patente__icontains=search) |
                Q(cliente__nombre__icontains=search)
            )

        data = []

        for v in vehiculos:

            estacionado = Estadia.objects.filter(
                vehiculo=v,
                activa=True
            ).exists()

            data.append({
                "id": v.id,
                "patente": v.patente,
                "cliente": v.cliente.nombre,
                "telefono": v.cliente.telefono,
                "estacionado": estacionado
            })

        return Response(data)

class BuscarVehiculoView(APIView):

    def get(self, request):

        patente = request.GET.get("patente")

        if not patente:
            return Response(
                {"error": "Debe ingresar una patente"},
                status=400
            )

        try:
            vehiculo = Vehiculo.objects.get(patente__iexact=patente)
        except Vehiculo.DoesNotExist:
            return Response({
                "existe": False
            })

        # Ver si está estacionado
        estadia_activa = Estadia.objects.filter(
            vehiculo=vehiculo,
            activa=True
        ).first()

        data = {
            "existe": True,
            "vehiculo": {
                "id": vehiculo.id,
                "patente": vehiculo.patente,
                "cliente": vehiculo.cliente.nombre,
                "telefono": vehiculo.cliente.telefono
            },
            "estacionado": bool(estadia_activa),
            "estadia": None
        }

        if estadia_activa:
            data["estadia"] = {
                "id": estadia_activa.id,
                "fecha_entrada": estadia_activa.fecha_entrada,
                "tipo_estadia": estadia_activa.tipo_estadia
            }

        return Response(data)
    
class VehiculoDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer

    def delete(self, request, *args, **kwargs):

        vehiculo = self.get_object()

        if vehiculo.estadia_set.filter(activa=True).exists():
            return Response(
                {"error": "El vehículo tiene una estadía activa"},
                status = 400
            )

        return super().delete(request, *args, **kwargs)