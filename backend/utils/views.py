from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q

from clients.models import Cliente
from vehicles.models import Vehiculo
from parking.models import Estadia
from payments.models import Pago

class GlobalSearchView(APIView):

    def get(self, request):

        query = request.query_params.get("q", "")

        if not query:
            return Response({
                "clientes": [],
                "vehiculos": [],
                "estadias": [],
                "pagos": []
            })

        # 🟪 CLIENTES
        clientes = Cliente.objects.filter(
            Q(nombre__icontains=query) |
            Q(dni__icontains=query)
        )[:5]

        data_clientes = [
            {
                "id": c.id,
                "nombre": c.nombre,
                "dni": c.dni,
                "telefono": c.telefono
            }
            for c in clientes
        ]

        # 🟪 VEHICULOS
        vehiculos = Vehiculo.objects.filter(
            Q(patente__icontains=query) |
            Q(cliente__nombre__icontains=query) |
            Q(cliente__dni__icontains=query)
        )[:5]

        data_vehiculos = [
            {
                "id": v.id,
                "patente": v.patente,
                "cliente": v.cliente.nombre
            }
            for v in vehiculos
        ]

        # 🟪 ESTADIAS
        estadias = Estadia.objects.filter(
            Q(vehiculo__patente__icontains=query) |
            Q(vehiculo__cliente__nombre__icontains=query)
        )[:5]

        data_estadias = [
            {
                "id": e.id,
                "patente": e.vehiculo.patente,
                "cliente": e.vehiculo.cliente.nombre,
                "activa": e.activa,
                "deuda": e.deuda()
            }
            for e in estadias
        ]

        # 🟪 PAGOS
        pagos = Pago.objects.filter(
            Q(estadia__vehiculo__patente__icontains=query) |
            Q(estadia__vehiculo__cliente__nombre__icontains=query)
        )[:5]

        data_pagos = [
            {
                "id": p.id,
                "patente": p.estadia.vehiculo.patente,
                "cliente": p.estadia.vehiculo.cliente.nombre,
                "monto": p.monto,
                "fecha": p.fecha_pago
            }
            for p in pagos
        ]

        return Response({
            "clientes": data_clientes,
            "vehiculos": data_vehiculos,
            "estadias": data_estadias,
            "pagos": data_pagos
        })