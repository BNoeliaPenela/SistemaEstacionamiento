from django.contrib import admin

# Register your models here.
from .models import Pago

admin.site.register(Pago) #Registrar el modelo Pago en el panel de administración de Django.