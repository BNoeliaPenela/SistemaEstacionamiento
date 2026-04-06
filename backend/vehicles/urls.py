from django.urls import path
from .views import BuscarVehiculoView, VehicleCreateView, VehicleByPlateView, VehiculosListView, VehiculoDetailView

urlpatterns = [
    path('create/', VehicleCreateView.as_view()),
    path('search/', VehicleByPlateView.as_view()),
    path('', VehiculosListView.as_view()),
    path("buscar/", BuscarVehiculoView.as_view()),
    path('<int:pk>/', VehiculoDetailView.as_view()),
]