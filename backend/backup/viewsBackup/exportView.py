

from datetime import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from backup.utils import generar_backup


#EXPORT MANUAL 
class ExportBackupView(APIView):

    def get(self, request):

        data_json = generar_backup()

        fecha = datetime.now().strftime("%Y-%m-%d_%H-%M")

        response = HttpResponse(
            data_json,
            content_type='application/json'
        )

        response['Content-Disposition'] = f'attachment; filename="backup_{fecha}.json"'

        return response


