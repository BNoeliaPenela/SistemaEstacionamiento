from django.shortcuts import render
from rest_framework.filters import SearchFilter
from rest_framework import generics
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q #Importar la función Q para realizar consultas complejas en la base de datos.
from ..models import Cliente
from vehicles.models import Vehiculo
from parking.models import Estadia
from payments.models import Pago
from payments.serializers import PagoSerializer
from clients.serializers import ClienteSerializer


class ClientCreateView(generics.CreateAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class ClientesListView(APIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    filter_backends = [SearchFilter]
    search_fields = ['nombre', 'dni', 'telefono']

    def get(self, request):

        search = request.GET.get("search")

        clientes = Cliente.objects.all().annotate(
            cantidad_vehiculos=Count("vehiculos")
        )

        if search:
            clientes = clientes.filter(
                Q(nombre__icontains=search) |
                Q(telefono__icontains=search) |
                Q(dni__icontains=search)
            )

        data = []

        for c in clientes:
            data.append({
                "id": c.id,
                "nombre": c.nombre,
                "telefono": c.telefono,
                "vehiculos": c.cantidad_vehiculos
            })

        return Response(data)

class ClienteDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get(self, request, pk):

        try:
            cliente = Cliente.objects.get(pk=pk)
        except Cliente.DoesNotExist:
            return Response({"error": "Cliente no encontrado"}, status=404)

        # 🟪 VEHÍCULOS
        vehiculos = Vehiculo.objects.filter(cliente=cliente)

        data_vehiculos = [
            {
                "id": v.id,
                "patente": v.patente
            }
            for v in vehiculos
        ]

        # 🟪 ESTADÍAS
        estadias = Estadia.objects.filter(
            vehiculo__cliente=cliente
        ).order_by('-fecha_entrada')

        data_estadias = [
            {
                "id": e.id,
                "patente": e.vehiculo.patente,
                "fecha_entrada": e.fecha_entrada,
                "fecha_salida": e.fecha_salida_real,
                "activa": e.activa,
                "precio": e.precio
            }
            for e in estadias
        ]

        # 🟪 PAGOS
        pagos = Pago.objects.filter(
            estadia__vehiculo__cliente=cliente
        ).order_by('-fecha_pago')

        data_pagos = [
            {
                "id": p.id,
                "patente": p.estadia.vehiculo.patente,
                "monto": p.monto,
                "metodo": p.metodo_pago,
                "fecha": p.fecha_pago
            }
            for p in pagos
        ]

        # 🟪 RESPONSE FINAL
        return Response({
            "id": cliente.id,
            "nombre": cliente.nombre,
            "telefono": cliente.telefono,
            "vehiculos": data_vehiculos,
            "estadias": data_estadias,
            "pagos": data_pagos
        })

    def delete(self, request, *args, **kwargs):

        cliente = self.get_object()

        if cliente.vehiculos.exists():
            return Response(
                {"error": "No se puede eliminar un cliente con vehículos asociados"},
                status=400
            )

        return super().delete(request, *args, **kwargs)
