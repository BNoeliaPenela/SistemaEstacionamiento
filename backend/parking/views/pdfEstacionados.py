from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from rest_framework.views import APIView
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

from parking.models import Estadia


class AutosEstacionadosPDFView(APIView):

    def get(self, request):

        estadias = Estadia.objects.filter(activa=True)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="autos_estacionados.pdf"'

        p = canvas.Canvas(response, pagesize=letter)

        width, height = letter
        y = height - 50

        # 🟪 TÍTULO
        p.setFont("Helvetica-Bold", 16)
        p.drawString(150, y, "AUTOS ESTACIONADOS")

        y -= 20

        from django.utils import timezone
        fecha_hoy = timezone.now().strftime("%d/%m/%Y")

        p.setFont("Helvetica", 10)
        p.drawString(200, y, f"Fecha: {fecha_hoy}")

        y -= 40

        # 🟪 TABLA
        data = [
            ["Patente", "Cliente", "Ingreso", "Tipo", "Deuda"]
        ]

        for e in estadias:

            fecha_ingreso = e.fecha_entrada.strftime("%d/%m %H:%M") if e.fecha_entrada else "-"
            deuda = f"$ {e.deuda()}" if hasattr(e, "deuda") else "-"

            data.append([
                e.vehiculo.patente,
                e.vehiculo.cliente.nombre,
                fecha_ingreso,
                e.tipo_estadia,
                deuda
            ])

        table = Table(data)

        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.black),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),

            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),

            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),

            ('GRID', (0, 0), (-1, -1), 1, colors.grey),

            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ])

        table.setStyle(style)

        table.wrapOn(p, width, height)
        table.drawOn(p, 40, y - (25 * len(data)))

        p.save()

        return response