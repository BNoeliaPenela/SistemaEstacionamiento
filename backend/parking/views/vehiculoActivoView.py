

from parking.models import Estadia
from rest_framework.views import APIView
from rest_framework.response import Response

class VehiculoActivoView(APIView):

    def get(self, request):
        patente = request.query_params.get("patente")

        try:
            estadia = Estadia.objects.get(
                vehiculo__patente=patente,
                activa=True
            )
        except Estadia.DoesNotExist:
            return Response(
                {"error": "No hay estadía activa"},
                status=404
            )

        return Response({
            "vehiculo_id": estadia.vehiculo.id,
            "patente": estadia.vehiculo.patente,
            "marca": estadia.vehiculo.marca,
            "modelo": estadia.vehiculo.modelo,
            "color": estadia.vehiculo.color,
            "fecha_entrada": estadia.fecha_entrada,
            "deuda": estadia.deuda()
        })