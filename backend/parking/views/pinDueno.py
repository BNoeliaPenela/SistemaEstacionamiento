from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from parking.models import Configuracion  

@api_view(['POST'])
def validar_pin_dueno(request):
    pin_ingresado = request.data.get('pin', '')
    
    # Obtenemos la configuración o la creamos con PIN '1234' por defecto si no existe
    config, _ = Configuracion.objects.get_or_create(id=1)
    
    if pin_ingresado == config.pin_dueno:
        return Response({"valido": True, "mensaje": "Acceso concedido"}, status=status.HTTP_200_OK)
    
    return Response({"valido": False, "error": "PIN incorrecto. Intentá de nuevo."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def cambiar_pin_dueno(request):
    pin_actual = request.data.get('pin_actual', '')
    pin_nuevo = request.data.get('pin_nuevo', '')

    config, _ = Configuracion.objects.get_or_create(id=1)

    # Validar PIN actual
    if pin_actual != config.pin_dueno:
        return Response({"error": "El PIN actual es incorrecto"}, status=status.HTTP_400_BAD_REQUEST)

    if len(pin_nuevo) < 4:
        return Response({"error": "El nuevo PIN debe tener al menos 4 dígitos"}, status=status.HTTP_400_BAD_REQUEST)

    config.pin_dueno = pin_nuevo
    config.save()

    return Response({"mensaje": "PIN actualizado correctamente"}, status=status.HTTP_200_OK)