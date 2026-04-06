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

        if estadia.activa:
            return Response(
                {"error": "No se puede eliminar una estadía activa"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if estadia.payments.exists():
            return Response(
                {"error": "No se puede eliminar una estadía con pagos"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().delete(request, *args, **kwargs)