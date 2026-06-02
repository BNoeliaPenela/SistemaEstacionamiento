from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from parking.serializers import EstadiaSerializer
from utils.fechas import obtener_rango_fechas
from parking.models import Estadia
from django.utils.timezone import make_aware
from datetime import datetime

class EstadiasListView(ListAPIView):

    serializer_class = EstadiaSerializer
    queryset = Estadia.objects.all()

    filter_backends = [SearchFilter]
    search_fields = [
        'vehiculo__patente',
        'vehiculo__cliente__nombre',
        'vehiculo__cliente__dni'
    ]

    def get_queryset(self):

        queryset = Estadia.objects.all()

        # 🔎 filtro por fecha
        filtro = self.request.GET.get("filtro")

        if filtro:
            inicio, fin = obtener_rango_fechas(filtro)
            

            print("Inicio:", inicio)
            print("Fin:", fin)
            print("Queryset count:", queryset.count())
            if inicio and fin:
                inicio_dt = make_aware(datetime.combine(inicio, datetime.min.time()))   
                fin_dt = make_aware(datetime.combine(fin, datetime.max.time()))
                print("Inicio DT:", inicio_dt)
                print("Fin DT:", fin_dt)
                queryset = queryset.filter(
                    fecha_entrada__date__range=(inicio_dt, fin_dt)
                )
            else:
                print("Filtro inválido:", filtro)    

        # 🔎 filtro activa
        activa = self.request.GET.get("activa")

        queryset = queryset.order_by('-activa', '-fecha_entrada')

        if activa == "true":
            queryset = queryset.filter(activa=True)
        elif activa == "false":
            queryset = queryset.filter(activa=False)

        return queryset
    
