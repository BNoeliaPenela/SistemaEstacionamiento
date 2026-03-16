from django.contrib import admin

# Register your models here.
from .models import Cliente

admin.site.register(Cliente) #Registrar el modelo Cliente en el panel de administración de Django.