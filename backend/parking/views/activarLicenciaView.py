from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from parking.models import ConfigLicencia

class ActivarLicenciaView(APIView):
    def post(self, request):
        codigo = request.data.get("codigo", "")
        licencia = ConfigLicencia.objects.first()

        if licencia and codigo.endswith(licencia.frase_secreta):
            try:
                partes = codigo.split('-')
                fecha_str = f"{partes[1]}-{partes[2]}-{partes[3]}"
                nueva_fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()

                licencia.fecha_limite = nueva_fecha
                licencia.save()

                return Response({"status": "OK", "mensaje": "Sistema activado con éxito."})
            except Exception:
                pass

        return Response(
            {"error": "Código de activación inválido o formato incorrecto."}, 
            status=status.HTTP_400_BAD_REQUEST
        )