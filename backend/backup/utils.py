import json


from parking.models import Estadia
from payments.models import Pago
from vehicles.models import Vehiculo
from clients.models import Cliente
from django.core import serializers


def generar_backup():

    data = []

    data.extend(json.loads(serializers.serialize('json', Cliente.objects.all())))
    data.extend(json.loads(serializers.serialize('json', Vehiculo.objects.all())))
    data.extend(json.loads(serializers.serialize('json', Estadia.objects.all())))
    data.extend(json.loads(serializers.serialize('json', Pago.objects.all())))

    return json.dumps(data, indent=2)