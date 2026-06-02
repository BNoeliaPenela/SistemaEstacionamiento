from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

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

        # Optimizamos consultas con select_related
        vehiculos = Vehiculo.objects.filter(cliente=cliente)
        estadias = Estadia.objects.filter(vehiculo__cliente=cliente).order_by('-fecha_entrada').select_related('vehiculo')

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="cliente_{pk}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter
        
        margin_x = 54
        y = height - 60

        # === 🟪 ENCABEZADO PRINCIPAL ===
        p.setFont("Helvetica-Bold", 18)
        p.setFillColor(colors.HexColor("#0F172A"))
        p.drawString(margin_x, y, "FICHA INFORMATIVA DE CLIENTE")

        # Línea decorativa de la marca (Azul)
        y -= 8
        p.setStrokeColor(colors.HexColor("#3B82F6"))
        p.setLineWidth(2)
        p.line(margin_x, y, width - margin_x, y)

        # Fecha de impresión
        y -= 18
        p.setFont("Helvetica", 9)
        p.setFillColor(colors.HexColor("#64748B"))
        p.drawString(margin_x, y, f"Impreso el: {timezone.now().strftime('%d/%m/%Y a las %H:%M hs')}")
        
        y -= 25

        # === 🟪 SECCIÓN: DATOS DE CONTACTO (Diseño tipo Tarjeta) ===
        p.setFont("Helvetica-Bold", 11)
        p.setFillColor(colors.HexColor("#1E293B"))
        p.drawString(margin_x, y, "DATOS PERSONALES")
        
        y -= 13
        # Dibujamos un contenedor gris claro de fondo para agrupar los datos
        p.setFillColor(colors.HexColor("#F8FAFC"))
        p.setStrokeColor(colors.HexColor("#E2E8F0"))
        p.setLineWidth(0.5)
        p.roundRect(margin_x, y - 48, width - (margin_x * 2), 48, 6, fill=True, stroke=True)
        
        # Textos dentro del contenedor
        p.setFillColor(colors.HexColor("#334155"))
        p.setFont("Helvetica", 10)
        p.drawString(margin_x + 15, y - 18, f"Nombre Completo:  {cliente.nombre}")
        p.drawString(margin_x + 15, y - 36, f"Teléfono de Contacto:  {cliente.telefono if cliente.telefono else 'No registrado'}")

        y -= 65

        # === 🟪 SECCIÓN: VEHÍCULOS ASOCIADOS ===
        p.setFont("Helvetica-Bold", 11)
        p.setFillColor(colors.HexColor("#1E293B"))
        p.drawString(margin_x, y, "VEHÍCULOS REGISTRADOS")
        
        y -= 18
        p.setFont("Helvetica-Bold", 10)
        p.setFillColor(colors.HexColor("#475569"))
        
        # Listamos las patentes en una sola línea estética separadas por guiones o viñetas
        lista_patentes = [v.patente for v in vehiculos]
        if lista_patentes:
            patentes_texto = "   |   ".join(lista_patentes)
            p.drawString(margin_x + 10, y, f"🚗  {patentes_texto}")
        else:
            p.setFont("Helvetica-Oblique", 10)
            p.drawString(margin_x + 10, y, "No tiene vehículos asociados actualmente.")
        
        y -= 35

        # === 🟪 SECCIÓN: HISTORIAL DE ESTADÍAS (Tabla) ===
        p.setFont("Helvetica-Bold", 11)
        p.setFillColor(colors.HexColor("#1E293B"))
        p.drawString(margin_x, y, "HISTORIAL RECIENTE DE ESTADÍAS")

        y -= 15

        data = [
            ["Vehículo", "Fecha/Hora Entrada", "Fecha/Hora Salida", "Monto", "Fecha de Pago"]
        ]

        for e in estadias:
            # Traemos el pago de forma segura
            pago = Pago.objects.filter(estadia=e).first()

            fecha_entrada = e.fecha_entrada.strftime("%d/%m/%Y %H:%M") if e.fecha_entrada else "-"
            fecha_salida = e.fecha_salida_real.strftime("%d/%m/%Y %H:%M") if e.fecha_salida_real else "En curso (No salió)"
            
            # 🔒 LOGICA INTELIGENTE DE PRECIO/DEUDA
            if e.activa or e.precio == 1000:
                monto = "Cobro al Egreso"
            else:
                monto = f"$ {e.precio:,}" if e.precio else "-"
                
            fecha_pago = pago.fecha_pago.strftime("%d/%m/%Y") if pago else "Pendiente"

            data.append([
                e.vehiculo.patente,
                fecha_entrada,
                fecha_salida,
                monto,
                fecha_pago
            ])

        # Definimos anchos proporcionales que sumen 504 puntos (el espacio utilizable de la hoja)
        col_widths = [74, 115, 115, 100, 100]
        table = Table(data, colWidths=col_widths)

        # Aplicamos los estilos modernos del Dashboard anterior
        style_commands = [
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#7E7E7E")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
            ('TOPPADDING', (0, 0), (-1, 0), 7),
            
            # Cuerpo
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#334155")),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            
            # Líneas divisorias horizontales tenues
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]

        # Cebreado dinámico de filas
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F8FAFC")))
            else:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), colors.white))

        table.setStyle(TableStyle(style_commands))

        # Renderizar la tabla de forma segura calculando el espacio restante
        table.wrapOn(p, width, height)
        alto_tabla = 23 + (20 * (len(data) - 1))
        y_pos = y - alto_tabla

        table.drawOn(p, margin_x, y_pos)

        # Pie de página fijo
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor("#94A3B8"))
        p.drawString(margin_x, 30, f"Ficha generada automáticamente por control de auditoría. Id Cliente: {cliente.id}")

        p.save()
        return response