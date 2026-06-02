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
                "tipo": v.tipo,
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
        
        queryset_coincidencias = Vehiculo.objects.filter(patente__icontains=patente)
        vehiculo_exacto = queryset_coincidencias.filter(patente__iexact=patente).first()
        # 2. Intentamos ver si hay una coincidencia exacta para el flujo normal
        sugerencias = queryset_coincidencias[:5]
        sugerencias_data = []
        for v in sugerencias:
            
            sugerencias_data.append({
                "id": v.id,
                "patente": v.patente,
                # Usamos getattr por seguridad si los campos no existen en el modelo
                "marca": getattr(v, 'marca', ''), 
                "modelo": getattr(v, 'modelo', '')
            })

        data = {
            "exists": bool(vehiculo_exacto),
            "existe": bool(vehiculo_exacto),
            "sugerencias": sugerencias_data,
            "vehiculo": None
        }

        if vehiculo_exacto:
            estadia_activa = Estadia.objects.filter(
                vehiculo=vehiculo_exacto,
                activa=True
            ).first()

            # Validación de seguridad para el cliente en el vehículo exacto
            nombre_cliente_exacto = vehiculo_exacto.cliente.nombre if vehiculo_exacto.cliente else "Sin Cliente"
            telefono_cliente_exacto = vehiculo_exacto.cliente.telefono if vehiculo_exacto.cliente else "N/A"

            data["vehiculo"] = {
                "id": vehiculo_exacto.id,
                "patente": vehiculo_exacto.patente,
                "cliente": nombre_cliente_exacto if vehiculo_exacto.cliente else "Sin Cliente",
                "telefono": telefono_cliente_exacto if vehiculo_exacto.cliente else "N/A"
            }
            
            data["estacionado"] = bool(estadia_activa)
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