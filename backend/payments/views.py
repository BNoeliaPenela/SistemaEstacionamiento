from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from django.utils import timezone
from parking.models import Estadia
from payments.serializers import PagoSerializer
from utils.fechas import obtener_rango_fechas
from rest_framework.filters import SearchFilter
from .models import Pago


class CrearPagoView(APIView):
    

    def post(self, request):

        estadia_id = request.data.get("estadia")
        monto = request.data.get("monto")
        metodo = request.data.get("metodo_pago")
        confirmado = request.data.get("confirmado", False)

        # Validaciones básicas
        if not estadia_id or not monto:
            return Response(
                {"error": "Faltan datos"},
                status=400
            )

        try:
            estadia = Estadia.objects.get(id=estadia_id)
        except Estadia.DoesNotExist:
            return Response(
                {"error": "Estadía no encontrada"},
                status=404
            )

        if not estadia.activa:
            return Response(
                {"error": "No se pueden registrar pagos en una estadía finalizada"},
                status=400
            )
        
        try:
            monto = float(monto)
        except:
            return Response(
                {"error": "Monto inválido"},
                status=400
            )

        if monto <= 0:
            return Response(
                {"error": "El monto debe ser mayor a 0"},
                status=400
            )

        deuda = estadia.deuda()
        monto = float(monto)

        warnings = []

        if monto > deuda:
            warnings.append("El monto supera la deuda")

        if monto < deuda:
            warnings.append("El monto es menor a la deuda")

        #SI HAY WARNING Y NO CONFIRMÓ → NO GUARDA
        if warnings and not confirmado:
            return Response({
                "warnings": warnings,
                "requiere_confirmacion": True
            }, status=404)

        #SI CONFIRMÓ → GUARDA IGUAL
        pago = Pago.objects.create(
            estadia=estadia,
            monto=monto,
            metodo_pago=metodo if metodo else "efectivo",
            fecha_pago=timezone.now(),
            tipo="pago"
        )

        return Response({
            "mensaje": "Pago registrado correctamente",
            "pago_id": pago.id,
            "warnings": warnings
        })
class PagosListView(APIView):
    queryset = Pago.objects.all().order_by('-fecha_pago')
    serializer_class = PagoSerializer

    filter_backends = [SearchFilter]
    search_fields = [
        'estadia__vehiculo__patente',
        'estadia__vehiculo__cliente__nombre',
        'estadia__vehiculo__cliente__dni'
    ]

    def get(self, request):

        fecha = request.GET.get("fecha")

        pagos = Pago.objects.all()
        
        filtro = request.GET.get("filtro")

        if filtro:
            inicio, fin = obtener_rango_fechas(filtro)

            if inicio and fin:
                pagos = pagos.filter(
                    fecha_pago__date__range=(inicio, fin)
                )

        hoy = timezone.now().date()

        if fecha == "hoy":
            pagos = pagos.filter(fecha_pago__date=hoy)

        if fecha == "mes":
            pagos = pagos.filter(
                fecha_pago__month=hoy.month,
                fecha_pago__year=hoy.year
            )

        data = []

        for p in pagos:
            data.append({
                "id": p.id,
                "monto": p.monto,
                "metodo": p.metodo_pago,
                "fecha": p.fecha_pago,
                "patente": p.estadia.vehiculo.patente,
                "cliente": p.estadia.vehiculo.cliente.nombre
            })

        return Response(data)

class ReversarPagoView(APIView):

    def post(self, request, pk):

        try:
            pago = Pago.objects.get(pk=pk)
        except Pago.DoesNotExist:
            return Response(
                {"error": "Pago no encontrado"},
                status= 404
            )

        # validar que la estadía esté activa
        if not pago.estadia.activa:
            return Response(
                {"error": "No se puede reversar un pago de una estadía finalizada"},
                status=400
            )
        
        # evitar doble reverso
        if pago.tipo == "reverso":
            return Response(
                {"error": "No se puede reversar un reverso"},
                status=404
            )

        if pago.reversiones.exists():
            return Response(
                {"error": "Este pago ya fue reversado"},
                status=404
            )

        # crear reverso
        reverso = Pago.objects.create(
            estadia=pago.estadia,
            monto= -pago.monto,
            metodo_pago=pago.metodo_pago,
            fecha_pago=timezone.now(),
            tipo="reverso",
            pago_original=pago
        )

        return Response({
            "mensaje": "Pago reversado correctamente",
            "reverso_id": reverso.id
        })
    
class ValidarPagoView(APIView):

    def post(self, request):

        estadia_id = request.data.get("estadia")
        monto = request.data.get("monto")

        # Validaciones básicas
        if not estadia_id or not monto:
            return Response(
                {"error": "Debe enviar estadia y monto"},
                status=400
            )

        try:
            estadia = Estadia.objects.get(id=estadia_id)
        except Estadia.DoesNotExist:
            return Response(
                {"error": "Estadía no encontrada"},
                status=400
            )

        if not estadia.activa:
            return Response(
                {"error": "La estadía no está activa"},
                status=400
            )

        try:
            monto = float(monto)
        except:
            return Response(
                {"error": "Monto inválido"},
                status=400
            )

        if monto <= 0:
            return Response(
                {"error": "El monto debe ser mayor a 0"},
                status=400
            )

        deuda = estadia.deuda()

        warnings = []

        if float(monto) > deuda:
            warnings.append("El monto supera la deuda")

        if float(monto) < deuda:
            warnings.append("El monto es menor a la deuda")

        return Response({
            "ok": True,
            "deuda": deuda,
            "warnings": warnings,
            "requiere_confirmacion": len(warnings) > 0
        })