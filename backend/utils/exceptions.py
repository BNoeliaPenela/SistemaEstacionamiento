from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):

    
    response = exception_handler(exc, context)

    if response is not None:
        mensaje = response.data

        if isinstance(mensaje, dict):
            mensaje = list(mensaje.values())[0]

        response.data = {
            "error": True,
            "mensaje": mensaje
        }

    return response