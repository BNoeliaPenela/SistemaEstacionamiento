from django.utils import timezone
from datetime import timedelta


def obtener_rango_fechas(filtro):

    hoy = timezone.localdate()

    if filtro == "hoy":
        inicio = hoy
        fin = hoy

    elif filtro == "ayer":
        inicio = hoy - timedelta(days=1)
        fin = inicio

    elif filtro == "7dias":
        inicio = hoy - timedelta(days=7)
        fin = hoy

    elif filtro == "mes":
        inicio = hoy.replace(day=1)
        fin = hoy

    else:
        return None, None

    return inicio, fin