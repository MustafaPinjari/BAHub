import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_invoice_pdf_content(payment):
    """
    Generates a professional PDF invoice using ReportLab.
    Returns bytes of the generated PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E1B4B'), # Dark purple Indigo
        spaceAfter=15
    )
    
    label_style = ParagraphStyle(
        'InvoiceLabel',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569') # Slate gray
    )
    
    body_style = ParagraphStyle(
        'InvoiceBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    elements = []
    
    # Title
    elements.append(Paragraph("INVOICE / RECEIPT", title_style))
    elements.append(Spacer(1, 10))
    
    # Header Info Table (Logo/Company details on left, Invoice details on right)
    company_details = """
    <b>BAHub Platforms Inc.</b><br/>
    100 Enterprise Way, Suite 500<br/>
    San Francisco, CA 94107<br/>
    support@bahub.com
    """
    
    date_str = payment.paid_at.strftime('%Y-%m-%d') if payment.paid_at else payment.created_at.strftime('%Y-%m-%d')
    invoice_details = f"""
    <b>Receipt Number:</b> {payment.receipt_number}<br/>
    <b>Date:</b> {date_str}<br/>
    <b>Payment Method:</b> {payment.payment_method or 'Card (Stripe)'}<br/>
    <b>Status:</b> {payment.payment_status}
    """
    
    header_data = [
        [Paragraph(company_details, body_style), Paragraph(invoice_details, body_style)]
    ]
    
    header_table = Table(header_data, colWidths=[260, 260])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # Bill To section
    bill_to_details = f"""
    <b>BILL TO:</b><br/>
    {payment.organization.name}<br/>
    Plan: {payment.plan.upper()} Tier Subscription<br/>
    """
    elements.append(Paragraph(bill_to_details, body_style))
    elements.append(Spacer(1, 20))
    
    # Line Items Table
    table_data = [
        [Paragraph("<b>Description</b>", label_style), Paragraph("<b>Billing Cycle</b>", label_style), Paragraph("<b>Amount</b>", label_style)]
    ]
    
    desc = f"BAHub {payment.plan.capitalize()} Subscription monthly license"
    table_data.append([
        Paragraph(desc, body_style),
        Paragraph(payment.billing_cycle.capitalize(), body_style),
        Paragraph(f"${payment.amount}", body_style)
    ])
    
    # Tax/Totals
    table_data.append([Paragraph("", body_style), Paragraph("<b>Taxes & GST:</b>", body_style), Paragraph(f"${payment.tax}", body_style)])
    table_data.append([Paragraph("", body_style), Paragraph("<b>Total Paid:</b>", body_style), Paragraph(f"${payment.amount}", body_style)])
    
    item_table = Table(table_data, colWidths=[320, 100, 100])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#E2E8F0')),
        ('LINEBELOW', (0,1), (-1,1), 1, colors.HexColor('#E2E8F0')),
        ('LINEBELOW', (0,-1), (-1,-1), 1.5, colors.HexColor('#1E1B4B')),
        ('TOPPADDING', (0,2), (-1,-1), 6),
        ('BOTTOMPADDING', (0,2), (-1,-1), 6),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 40))
    
    # Footer note
    elements.append(Paragraph("Thank you for your business! If you have any questions, please contact support@bahub.com.", label_style))
    
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
