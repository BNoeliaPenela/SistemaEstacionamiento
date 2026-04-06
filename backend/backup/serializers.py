from rest_framework import serializers

class ImportBackupSerializer(serializers.Serializer):
    file = serializers.FileField()