from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Estadia
from ..serializers import EstadiaSerializer

class EstadiaDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Estadia.objects.all()
    serializer_class = EstadiaSerializer

    def update(self, request, *args, **kwargs):

        estadia = self.get_object()

        if not estadia.activa:
            return Response(
                {"error": "No se puede editar una estadía finalizada"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().update(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):

        estadia = self.get_object()

         # si tiene pagos → NO eliminar
        if estadia.payments.exists():
            return Response(
                {"error": "No se puede eliminar una estadía con pagos registrados"},
                status=400
            )

        # si NO está activa → tampoco
        if not estadia.activa:
            return Response(
                {"error": "Solo se pueden eliminar estadías activas sin pagos"},
                status=400
            )

        return super().delete(request, *args, **kwargs)