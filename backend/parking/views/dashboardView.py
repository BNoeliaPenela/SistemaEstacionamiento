from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from itertools import chain
from ..models import Estadia, EstadiaConfig
from payments.models import Pago
from django.db.models import Sum

class DashboardView(APIView):

    def get(self, request):

        #Autos activos
        estadias_activas = Estadia.objects.filter(activa=True)
        autos_activos = estadias_activas.count()

        # Espacios disponibles
        config = EstadiaConfig.objects.first()
        total_espacios = config.total_espacios if config else 0

        espacios_disponibles = total_espacios - autos_activos

        #Ingresos hoy
        hoy = timezone.localdate()

        pagos_hoy = Pago.objects.filter(fecha_pago__date=hoy)
        ingresos_hoy = sum(p.monto for p in pagos_hoy)
        
        #Ingresos mes
        pagos_mes = Pago.objects.filter(
            fecha_pago__year=hoy.year,
            fecha_pago__month=hoy.month
        )

        ingresos_mes = pagos_mes.aggregate(total=Sum("monto"))["total"] or 0

        #Deudores
        deudores = sum(1 for e in estadias_activas if e.deuda() > 0)

        #Autos estacionados (detalle)
        autos_estacionados = []

        for e in estadias_activas:
            autos_estacionados.append({
                "id": e.id,
                "patente": e.vehiculo.patente,
                "cliente": e.vehiculo.cliente.nombre,
                "fecha_ingreso": timezone.localtime(e.fecha_entrada),
                "tipo_estadia": e.tipo_estadia,
                "deuda": e.deuda(),
                "pagado": e.pagado(),
                "estado_pago": "pagado" if e.pagado() else "pendiente", 
                "alerta": e.estado_alerta()
            })
       

        return Response({
            "autos_activos": autos_activos,
            "espacios_disponibles": espacios_disponibles,
            "ingresos_hoy": ingresos_hoy,
            "ingresos_mes": ingresos_mes,
            "deudores": deudores,
            "autos_estacionados": autos_estacionados
        })


class ActividadRecienteView(APIView):

    def get(self, request):

        limite = 10  # cantidad de movimientos

        # ENTRADAS
        entradas = Estadia.objects.all().order_by('-fecha_entrada')[:limite]

        data_entradas = [
            {
                "tipo": "entrada",
                "patente": e.vehiculo.patente,
                "cliente": e.vehiculo.cliente.nombre,
                "fecha": timezone.localtime(e.fecha_entrada),
                "hora": timezone.localtime(e.fecha_entrada).strftime("%H:%M")
            }
            for e in entradas
        ]

        # SALIDAS
        salidas = Estadia.objects.filter(
            activa=False,
            fecha_salida_real__isnull=False
        ).order_by('-fecha_salida_real')[:limite]

        data_salidas = [
            {
                "tipo": "salida",
                "patente": s.vehiculo.patente,
                "cliente": s.vehiculo.cliente.nombre,
                "fecha": timezone.localtime(s.fecha_salida_real),
                "hora": timezone.localtime(s.fecha_salida_real).strftime("%H:%M")
            }
            for s in salidas
        ]

        # PAGOS
        pagos = Pago.objects.all().order_by('-fecha_pago')[:limite]

        data_pagos = [
            {
                "tipo": "reverso" if p.tipo == "reverso" else "pago",
                "patente": p.estadia.vehiculo.patente,
                "cliente": p.estadia.vehiculo.cliente.nombre,
                "monto": p.monto,
                "fecha": timezone.localtime(p.fecha_pago),
                "hora": timezone.localtime(p.fecha_pago).strftime("%H:%M")
            }
            for p in pagos
        ]

        # UNIR TODO
        actividad = list(chain(data_entradas, data_salidas, data_pagos))

        # ORDENAR POR FECHA DESC
        actividad.sort(key=lambda x: x["fecha"], reverse=True)

        # LIMITAR RESULTADO FINAL
        actividad = actividad[:limite]

        return Response(actividad)