from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from rest_framework.views import APIView
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from django.utils import timezone

from parking.models import Estadia


class AutosEstacionadosPDFView(APIView):

    def get(self, request):
        # Traemos solo las estadías activas con select_related para optimizar consultas a la BD
        estadias = Estadia.objects.filter(activa=True).select_related('vehiculo', 'vehiculo__cliente')

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="autos_estacionados.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter
        
        # Margen izquierdo estándar (54 puntos = 0.75 pulgadas)
        margin_x = 54
        y = height - 60

        # === 🟪 ENCABEZADO ESTÉTICO ===
        # Título principal
        p.setFont("Helvetica-Bold", 18)
        p.setFillColor(colors.HexColor("#0F172A"))  # Gris oscuro/Casi negro profesional
        p.drawString(margin_x, y, "VEHICULOS ESTACIONADOS")

        # Línea decorativa superior
        y -= 8
        p.setStrokeColor(colors.HexColor("#4E4E4E"))  
        p.setLineWidth(2)
        p.line(margin_x, y, width - margin_x, y)

        # Fecha y Metadatos
        y -= 18
        fecha_hoy = timezone.now().strftime("%d/%m/%Y - %H:%M hs")
        p.setFont("Helvetica-Bold", 9)
        p.setFillColor(colors.HexColor("#64748B"))  # Gris secundario
        p.drawString(margin_x, y, f"REPORTE GENERADO: {fecha_hoy}")
        
        # Total de autos activos en el momento
        p.drawRightString(width - margin_x, y, f"Total Vehículos: {estadias.count()}")

        y -= 25

        # === 🟪 MATRIZ DE DATOS (Modificada para incluir el Vehículo) ===
        data = [
            ["Patente", "Vehículo", "Cliente / Propietario", "Ingreso", "Estadía", "Estado / Deuda"]
        ]

        for e in estadias:
            fecha_ingreso = e.fecha_entrada.strftime("%d/%m %H:%M") if e.fecha_entrada else "-"
            tipo_estadia = str(e.tipo_estadia).upper()
            
            # 🔒 LÓGICA DE DEUDA INTELIGENTE FRONT-BACK
            valor_deuda = e.deuda() if hasattr(e, "deuda") else 0
            
            if valor_deuda == 1000:
                deuda_texto = "Pendiente de pago"
            elif valor_deuda == 0:
                deuda_texto = "Saldado"
            else:
                deuda_texto = f"$ {valor_deuda:,}"

            # Manejo seguro si no tiene cliente asignado
            cliente_nombre = e.vehiculo.cliente.nombre if e.vehiculo.cliente else "Particular"
            
            # Traemos marca y modelo de forma segura previniendo valores vacíos
            marca = e.vehiculo.marca if hasattr(e.vehiculo, "marca") and e.vehiculo.marca else ""
            modelo = e.vehiculo.modelo if hasattr(e.vehiculo, "modelo") and e.vehiculo.modelo else ""
            vehiculo_info = f"{marca} {modelo}".strip() if (marca or modelo) else "Sin datos"

            data.append([
                e.vehiculo.patente,
                vehiculo_info,    # 🚗 Nueva columna con Marca y Modelo ensamblados
                cliente_nombre,
                fecha_ingreso,
                tipo_estadia,
                deuda_texto
            ])

        # === 🟪 DISEÑO PROFESIONAL DE LA TABLA ===
        # Reajustamos los anchos para acomodar las 6 columnas de forma exacta (Suma 504)
        col_widths = [65, 95, 114, 85, 55, 90]
        
        table = Table(data, colWidths=col_widths)

        # Estilos avanzados estilo Dashboard moderno
        style_commands = [
            # Encabezado: Fondo Gris y texto blanco
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#A0A0A0")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Alineaciones estratégicas basadas en las nuevas columnas
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),   # Patente centrada
            ('ALIGN', (1, 0), (2, -1), 'LEFT'),     # Vehículo y Cliente alineados a la izquierda
            ('ALIGN', (3, 0), (5, -1), 'CENTER'),   # Ingreso, Estadía y Deuda centrados
            
            # Cuerpo de la tabla: Fuentes y Paddings confortables
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#334155")), # Texto charcoal suave
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            
            # Separadores horizontales sutiles
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]

        # Añadimos cebreado alterno dinámico para las filas del cuerpo
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F8FAFC"))) # Gris ultra-claro
            else:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), colors.white))

        table.setStyle(TableStyle(style_commands))

        # Cálculo preciso del alto de la tabla para posicionarla sin solapamientos
        table.wrapOn(p, width, height)
        
        # Estimación estándar del alto: 26pt el header + ~22pt por cada fila del bucle
        alto_tabla = 26 + (22 * (len(data) - 1))
        y_pos = y - alto_tabla - 10

        # Si el contenido no desborda la página, la dibuja directo en las coordenadas x, y
        table.drawOn(p, margin_x, y_pos)

        # Pie de página simple
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor("#94A3B8"))
        p.drawString(margin_x, 30, "Sistema de Gestión de Garage - Reporte Interno de Ocupación.")

        p.save()
        return response
        