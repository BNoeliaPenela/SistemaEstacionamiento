

from payments.models import Pago
from parking.models import Estadia
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
class VehiculoActivoView(APIView):

    def get(self, request):
        # Usamos .get("patente", "") para evitar errores si viene vacío
        patente = request.query_params.get("patente", "").strip().upper()

        # Si el usuario borró todo o el campo está vacío, devolvemos lista vacía rápido
        if not patente:
            return Response({"sugerencias": []}, status=status.HTTP_200_OK)

        # Cambiamos .get() por .filter() y agregamos __icontains para búsqueda parcial
        estadias_coincidentes = Estadia.objects.filter(
            vehiculo__patente__istartswith=patente,
            activa=True
        )

        # Si no hay ninguna coincidencia, devolvemos un 200 OK con la lista vacía
        # Esto evita que el frontend rompa con un error 404 en la consola
        if not estadias_coincidentes.exists():
            return Response({"sugerencias": []}, status=status.HTTP_200_OK)

        # Armamos la estructura de sugerencias para que el frontend las recorra
        sugerencias = []
        for estadia in estadias_coincidentes:
            deuda_actual = estadia.deuda()
            info_pago = None

            # Si ya se pagó (deuda es 0), buscamos el registro del pago
            if deuda_actual == 0:
                
                pago = Pago.objects.filter(estadia=estadia).last()
                if pago:
                    info_pago = {
                        "monto": pago.monto,
                        "metodo_pago": pago.metodo_pago,
                        "fecha_pago": pago.fecha_pago # O el nombre de tu campo de fecha en Pago
                    }

            sugerencias.append({
                "vehiculo_id": estadia.vehiculo.id,
                "patente": estadia.vehiculo.patente,
                "marca": estadia.vehiculo.marca,
                "modelo": estadia.vehiculo.modelo,
                "color": estadia.vehiculo.color,
                "fecha_entrada": estadia.fecha_entrada,
                "deuda": deuda_actual,
                "info_pago": info_pago 
            })

        return Response({"sugerencias": sugerencias}, status=status.HTTP_200_OK)