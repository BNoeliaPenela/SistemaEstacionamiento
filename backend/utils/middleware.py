from django.http import JsonResponse
from django.utils import timezone
from parking.models import ConfigLicencia

class ValidarLicenciaMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Permitimos que la ruta de activación pase siempre, sino nunca se podría destrabar
        if 'licencia/activar/' in request.path:
            return self.get_response(request)

        # Buscamos la configuración de la licencia
        licencia = ConfigLicencia.objects.first()
        
        if licencia:
            # Si hoy es posterior a la fecha límite, bloqueamos el acceso
            if timezone.now().date() > licencia.fecha_limite:
                return JsonResponse(
                    {
                        "error": "LICENCIA_VENCIDA", 
                        "mensaje": "Período de uso finalizado. Por favor, contacte al desarrollador."
                    }, 
                    status=403
                )

        return self.get_response(request)