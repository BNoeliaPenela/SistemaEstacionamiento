from django.template.loader import render_to_string
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from clients.models import Cliente
from payments.models import Pago
from vehicles.models import Vehiculo
from parking.models import Estadia


class ClientePDFView(APIView):
 def get(self, request, pk):

        try:
            cliente = Cliente.objects.get(pk=pk)
        except Cliente.DoesNotExist:
            return Response({"error": "Cliente no encontrado"}, status=404)

        vehiculos = Vehiculo.objects.filter(cliente=cliente)

        estadias = Estadia.objects.filter(
            vehiculo__cliente=cliente
        ).order_by('-fecha_entrada')

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="cliente_{pk}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)

        width, height = letter
        y = height - 50

        # 🟪 TÍTULO
        p.setFont("Helvetica-Bold", 18)
        p.drawString(180, y, "FICHA DE CLIENTE")

        y -= 40

        # 🟪 DATOS CLIENTE
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "DATOS DEL CLIENTE")

        y -= 20
        p.setFont("Helvetica", 11)
        p.drawString(50, y, f"Nombre: {cliente.nombre}")

        y -= 15
        p.drawString(50, y, f"Teléfono: {cliente.telefono}")

        y -= 30

        # 🟪 VEHÍCULOS
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "VEHÍCULOS")

        y -= 20
        p.setFont("Helvetica", 11)

        for v in vehiculos:
            p.drawString(60, y, f"- {v.patente}")
            y -= 15

        y -= 20

        # 🟪 HISTORIAL DE ESTADÍAS
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "HISTORIAL DE ESTADÍAS")

        y -= 20
        p.setFont("Helvetica", 10)

        data = [
            ["Vehículo", "Entrada", "Salida", "Monto", "Fecha Pago"]
        ]

        for e in estadias:

            pago = Pago.objects.filter(estadia=e).first()

            fecha_entrada = e.fecha_entrada.strftime("%d/%m/%Y %H:%M") if e.fecha_entrada else "-"
            fecha_salida = e.fecha_salida_real.strftime("%d/%m/%Y %H:%M") if e.fecha_salida_real else "-"
            monto = f"$ {e.precio}" if e.precio else "-"
            fecha_pago = pago.fecha_pago.strftime("%d/%m/%Y") if pago else "No pagado"

            data.append([
                e.vehiculo.patente,
                fecha_entrada,
                fecha_salida,
                monto,
                fecha_pago
            ])

        # Crear tabla
        table = Table(data)

        # Estilo
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),  # encabezado
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),

            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),

            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),

            ('GRID', (0, 0), (-1, -1), 1, colors.black),

            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ])

        table.setStyle(style)

        # Posición en la hoja
        table.wrapOn(p, width, height)
        table.drawOn(p, 50, y - (20 * len(data)))

        p.save()

        return response