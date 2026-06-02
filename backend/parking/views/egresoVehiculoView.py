
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from payments.serializers import PagoSerializer
from payments.services import crear_pago
from ..models import Estadia
from ..utils import calcular_precio_estadia

class EgresoVehiculoView(APIView): #Definición de una vista para registrar el egreso de un vehículo del estacionamiento utilizando la clase APIView, que permite manejar diferentes métodos HTTP. Esta vista se encargará de actualizar la estadía correspondiente al vehículo para marcarla como inactiva y calcular el precio de la estadía.


    def get(self, request):
        """
        Maneja las búsquedas dinámicas del frontend.
        Filtra las estadías activas cuya patente contenga los caracteres ingresados.
        """
        patente_query = request.GET.get("patente", "").upper()
        
        # Si no mandó nada o es muy corto, podés elegir no buscar, 
        # pero para que no tire 404 devolvemos una lista vacía.
        if not patente_query:
            return Response({"sugerencias": []}, status=status.HTTP_200_OK)
            
        # Filtramos estadías que estén ACTIVAS y que coincidan parcialmente con la patente
        estadias_activas = Estadia.objects.filter(
            activa=True,
            vehiculo__patente__icontains=patente_query # Asumo que tu modelo Estadia tiene una relación FK a 'vehiculo'
        )
        
        sugerencias = []
        for estadia in estadias_activas:
            sugerencias.append({
                "vehiculo_id": estadia.vehiculo.id,
                "patente": estadia.vehiculo.patente,
                "marca": estadia.vehiculo.marca if hasattr(estadia.vehiculo, 'marca') else "",
                "modelo": estadia.vehiculo.modelo if hasattr(estadia.vehiculo, 'modelo') else "",
                "fecha_entrada": estadia.fecha_entrada, # O el nombre de tu campo de ingreso
                "deuda": estadia.deuda() # Aprovechamos tu método .deuda() para mostrarla en tiempo real
            })
            
        return Response({"sugerencias": sugerencias}, status=status.HTTP_200_OK)
    
    def post(self, request): #Define un método post para manejar las solicitudes POST que se envían a esta vista. Este método se ejecutará cuando se intente registrar el egreso de un vehículo del estacionamiento.

        vehiculo_id = request.data.get("vehiculo")
        precio = request.data.get("precio")#Permite ingresar un precio manual para la estadía, en caso de que se quiera establecer un precio específico en lugar de calcularlo automáticamente. Este valor es opcional y se puede proporcionar en la solicitud.
        metodo = request.data.get("metodo_pago")

        if not vehiculo_id:
                return Response(
                    {"error": "Debe enviar el vehículo"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            estadia = Estadia.objects.get(
                vehiculo_id=vehiculo_id,
                activa=True
            )
        except Estadia.DoesNotExist:
            return Response(
                {"error": "El vehículo no tiene una estadía activa"},
                status=status.HTTP_400_BAD_REQUEST
            )

        deuda = estadia.deuda()


       # SI HAY DEUDA → COBRAR
        if deuda > 0:

            if not precio:
                return Response(
                    {"error": f"Debe ingresar el monto a pagar (deuda: ${deuda})"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                monto = float(precio)
            except:
                return Response(
                    {"error": "Monto inválido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if monto > deuda:
                return Response(
                    {"error": f"El monto excede la deuda (${deuda})"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # crear pago
            data_pago = {
                "estadia": estadia.id,
                "monto": monto,
                "metodo_pago": metodo if metodo else "efectivo"
            }

            serializer = PagoSerializer(data=data_pago)

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save()

        #cerrar estadía
        if estadia.deuda() > 0:
            return Response(
                {"error": "No se puede egresar sin pagar la deuda"},
                status=400
            )
        
        estadia.fecha_salida_real = timezone.now()
        estadia.activa = False
        estadia.save()

        return Response({
            "mensaje": "Egreso registrado correctamente",
            "fecha_salida": timezone.localtime(estadia.fecha_salida_real),
            "precio": estadia.precio,
            "metodo_pago": metodo
        })