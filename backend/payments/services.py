from .models import Pago

def crear_pago(estadia, monto, metodo="efectivo"):
    if monto <= 0:
        raise ValueError("Monto inválido")
    return Pago.objects.create(
        estadia=estadia,
        monto=monto,
        metodo_pago=metodo
    )