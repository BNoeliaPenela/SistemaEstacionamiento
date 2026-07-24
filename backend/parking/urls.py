from django.urls import path

from parking.views.pinDueno import cambiar_pin_dueno, validar_pin_dueno
from parking.views.activarLicenciaView import ActivarLicenciaView
from parking.views.vehiculoActivoView import VehiculoActivoView
from parking.views.estadiaDetailView import EstadiaDetailView
from parking.views.pdfEstacionados import AutosEstacionadosPDFView #Importar la función path de Django, que se utiliza para definir rutas URL en la aplicación.
from .views.crearEstadiaView import CrearEstadiaView

from .views.egresoVehiculoView import EgresoVehiculoView
from .views.dashboardView import ActividadRecienteView, DashboardView
from .views.estadiasListView import EstadiasListView

urlpatterns = [
    path('entrada/', CrearEstadiaView.as_view(), name='crear_estadia'), #Definir una ruta URL para la vista CrearEstadiaView, que se activará cuando se acceda a la URL 'estadia/' y se le asigna el nombre 'crear_estadia' para su referencia en otras partes de la aplicación.
    path('egreso/', EgresoVehiculoView.as_view()),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path("", EstadiasListView.as_view()),
    path("dashboard/actividad/", ActividadRecienteView.as_view()),
    path("pdf/estacionados/", AutosEstacionadosPDFView.as_view()),
    path('<int:pk>/', EstadiaDetailView.as_view()),
    path('vehiculo-activo/', VehiculoActivoView.as_view()),
    path('licencia/activar/', ActivarLicenciaView.as_view(), name='activar_licencia'),
    path('configuracion/validar-pin/', validar_pin_dueno, name='validar_pin'),
    path('configuracion/cambiar-pin/', cambiar_pin_dueno, name='cambiar_pin'),
]