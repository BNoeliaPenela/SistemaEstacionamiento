from datetime import datetime

def calcular_precio_estadia(estadia): #Función que calcula el precio de una estadía en función del tiempo transcurrido entre la fecha de ingreso y la fecha de salida.

    tiempo = estadia.fecha_salida - estadia.fecha_entrada
    horas = tiempo.total_seconds() / 3600

    tarifa_por_hora = 500

    precio = horas * tarifa_por_hora

    return round(precio, 2)