import json
import os
from datetime import datetime
import tempfile

from django.conf import settings
from django.core.management import call_command

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from backup.serializers import ImportBackupSerializer
from backup.utils import generar_backup


#  IMPORT CON BACKUP AUTOMÁTICO PREVIO
class ImportBackupView(APIView):

    parser_classes = [MultiPartParser]

    def post(self, request):
        
        serializer = ImportBackupSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        file = request.FILES.get('file')

        if not file:
            return Response(
                {"error": "No se envió archivo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 📦 1. CREAR BACKUP AUTOMÁTICO ANTES DE IMPORTAR
            backup_data = generar_backup()

            carpeta_backup = os.path.join(settings.BASE_DIR, "backups")
            os.makedirs(carpeta_backup, exist_ok=True)

            fecha = datetime.now().strftime("%Y-%m-%d_%H-%M")

            ruta_backup = os.path.join(
                carpeta_backup,
                f"auto_backup_{fecha}.json"
            )

            with open(ruta_backup, "w", encoding="utf-8") as f:
                f.write(backup_data)

            # 📂 2. GUARDAR ARCHIVO SUBIDO TEMPORALMENTE
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                for chunk in file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # 💣 3. BORRAR BASE
            call_command('flush', '--noinput')

            # 📥 4. IMPORTAR
            call_command('loaddata', tmp_path)

            return Response({
                "mensaje": "Backup importado correctamente",
                "backup_automatico": ruta_backup
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )