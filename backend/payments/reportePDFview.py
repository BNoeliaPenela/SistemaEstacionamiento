from datetime import datetime
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework.views import APIView
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

from payments.models import Pago
from parking.models import Estadia

class ReportePagosDiariosPDFView(APIView):

    def get(self, request):
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)

        # 1. 🔍 FILTRAR MOVIMIENTOS DEL DÍA
        # Buscamos los pagos realizados hoy (adaptar 'fecha_pago' al nombre de tu campo)
        pagos_hoy = Pago.objects.filter(
            fecha_pago__date=hoy
        ).select_related(
            'estadia', 'estadia__vehiculo'
        ).order_by('-fecha_pago') #Ordenado cronológicamente
        # 2. 🧮 CALCULAR MÉTRICAS Y TOTALES
        # Total del día (Suma de montos de hoy)
        total_dia = pagos_hoy.aggregate(total=Sum('monto'))['total'] or 0
        
        # Cantidad de pagos realizados hoy
        cantidad_pagos_hoy = pagos_hoy.aggregate(cantidad=Count('id'))['cantidad'] or 0

        # Total del mes (Suma de montos desde el 1 del mes actual hasta hoy)
        total_mes = Pago.objects.filter(fecha_pago__date__range=[inicio_mes, hoy]).aggregate(total=Sum('monto'))['total'] or 0

        # 3. 📄 CONFIGURAR RESPUESTA PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="cierre_caja_{hoy.strftime("%Y_%m_%d")}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter
        margin_x = 54
        y = height - 60

        # === 🟪 ENCABEZADO ===
        p.setFont("Helvetica-Bold", 18)
        p.setFillColor(colors.HexColor("#0F172A"))
        p.drawString(margin_x, y, "REPORTE DIARIO DE PAGOS Y CAJA")

        y -= 8
        p.setStrokeColor(colors.HexColor("#4E4E4E"))  
        p.setLineWidth(2)
        p.line(margin_x, y, width - margin_x, y)

        y -= 18
        fecha_generado = timezone.now().strftime("%d/%m/%Y - %H:%M hs")
        p.setFont("Helvetica-Bold", 9)
        p.setFillColor(colors.HexColor("#64748B"))
        p.drawString(margin_x, y, f"CAJA DEL DÍA: {hoy.strftime('%d/%m/%Y')} | GENERADO: {fecha_generado}")
        
        y -= 25

        # === 📊 TARJETAS DE INDICADORES (KPIs) ===
        # Dibujamos un pequeño recuadro gris con los tres datos clave que pidió
        p.setStrokeColor(colors.HexColor("#E2E8F0"))
        p.setFillColor(colors.HexColor("#F8FAFC"))
        p.rect(margin_x, y - 50, width - (margin_x * 2), 50, fill=True, stroke=True)

        p.setFillColor(colors.HexColor("#334155"))
        p.setFont("Helvetica", 9)
        # Textos fijos
        p.drawString(margin_x + 15, y - 20, "CANTIDAD PAGOS (HOY)")
        p.drawString(margin_x + 180, y - 20, "TOTAL RECAUDADO DIARIO")
        p.drawString(margin_x + 360, y - 20, "TOTAL ACUMULADO MENSUAL")

        # Valores dinámicos
        p.setFont("Helvetica-Bold", 14)
        p.setFillColor(colors.HexColor("#000000"))
        p.drawString(margin_x + 15, y - 42, f"{cantidad_pagos_hoy}")
        p.setFillColor(colors.HexColor("#000000")) # Verde para el dinero de hoy
        p.drawString(margin_x + 180, y - 42, f"$ {total_dia:,}")
        p.setFillColor(colors.HexColor("#000000")) # Azul para el mes
        p.drawString(margin_x + 360, y - 42, f"$ {total_mes:,}")

        y -= 85

        # === 🟪 MATRIZ DE LA TABLA DE MOVIMIENTOS ===
        p.setFont("Helvetica-Bold", 12)
        p.setFillColor(colors.HexColor("#0F172A"))
        p.drawString(margin_x, y, "Detalle de Movimientos")
        y -= 15

        data = [
            ["Vehículo (Patente)", "Monto", "Método", "Fecha / Hora", "Estado"]
        ]

        for pago in pagos_hoy:
            # Traemos los datos del vehículo de forma segura
            if pago.estadia and pago.estadia.vehiculo:
                v = pago.estadia.vehiculo
                marca = v.marca if hasattr(v, "marca") and v.marca else ""
                modelo = v.modelo if hasattr(v, "modelo") and v.modelo else ""
                patente = v.patente if v.patente else ""
                
                # Armamos el string: "Fiat Cronos (AF123JK)" o solo la patente si no hay modelo
                if marca or modelo:
                    vehiculo_texto = f"{marca} {modelo} ({patente})".strip()
                else:
                    vehiculo_texto = patente
            else:
                vehiculo_texto = "Particular"

            monto_formateado = f"$ {pago.monto:,}"
            metodo = str(pago.metodo_pago).upper() if pago.metodo_pago else "EFECTIVO"
            fecha = pago.fecha_pago.strftime("%d/%m %H:%M hs") if pago.fecha_pago else "-"
            estado = str(pago.tipo).upper() if pago.tipo else "COMPLETADO"

            data.append([
                vehiculo_texto,
                monto_formateado,
                metodo,
                fecha,
                estado
            ])

        # Anchos de columnas ajustados al espacio (Suma 504 puntos)
        col_widths = [150, 85, 85, 104, 80]
        table = Table(data, colWidths=col_widths)

        style_commands = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#A0A0A0")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            
            ('ALIGN', (0, 0), (0, -1), 'LEFT'), # Patente centrada
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Montos a la derecha
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'), # Método, Fecha y Estado centrados
            
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#334155")),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]

        # Cebreado
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F8FAFC")))

        table.setStyle(TableStyle(style_commands))
        table.wrapOn(p, width, height)
        
        alto_tabla = 22 + (20 * (len(data) - 1))
        y_pos = y - alto_tabla

        if y_pos < 50:
            p.showPage()
            y_pos = height - 80
        
        table.drawOn(p, margin_x, y_pos)

        # Pie de página
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor("#94A3B8"))
        p.drawString(margin_x, 30, "Cierre de Caja Diario - Confidencial Interno.")

        p.save()
        return response