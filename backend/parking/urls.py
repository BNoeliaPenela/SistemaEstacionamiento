from django.urls import path #Importar la función path de Django, que se utiliza para definir rutas URL en la aplicación.
from .views import CrearEstadiaView, VehiculosEstacionadosView
from .views import EgresoVehiculoView
urlpatterns = [
    path('estadia/', CrearEstadiaView.as_view(), name='crear_estadia'), #Definir una ruta URL para la vista CrearEstadiaView, que se activará cuando se acceda a la URL 'estadia/' y se le asigna el nombre 'crear_estadia' para su referencia en otras partes de la aplicación.
    path('estacionados/', VehiculosEstacionadosView.as_view(), name='estacionados'), 
    path('egreso/', EgresoVehiculoView.as_view()),
]