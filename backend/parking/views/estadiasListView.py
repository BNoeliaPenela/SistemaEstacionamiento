from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from parking.serializers import EstadiaSerializer
from utils.fechas import obtener_rango_fechas
from parking.models import Estadia


class EstadiasListView(APIView):

    
    queryset = Estadia.objects.all()
    serializer_class = EstadiaSerializer

    filter_backends = [SearchFilter]
    search_fields = [
        'vehiculo__patente',
        'vehiculo__cliente__nombre',
        'vehiculo__cliente__dni'
        ]

    def get(self, request):

        filtro = request.GET.get("filtro")

        if filtro:
            inicio, fin = obtener_rango_fechas(filtro)

            if inicio and fin:
                estadias = estadias.filter(
                    fecha_entrada__date__range=(inicio, fin)
                )
        activa = request.GET.get("activa")

        estadias = Estadia.objects.all()

        if activa == "true":
            estadias = estadias.filter(activa=True)

        data = []

        for e in estadias:

            data.append({
                "id": e.id,
                "patente": e.vehiculo.patente,
                "cliente": e.vehiculo.cliente.nombre,
                "fecha_entrada": e.fecha_entrada,
                "fecha_salida": e.fecha_salida_real,
                "activa": e.activa
            })

        return Response(data)