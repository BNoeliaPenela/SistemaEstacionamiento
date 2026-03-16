from django.contrib import admin

# Register your models here.
from .models import Vehiculo

admin.site.register(Vehiculo) #Registrar el modelo Vehiculo en el panel de administración de Django.