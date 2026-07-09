"""
Premium SaaS Payment Receipt Generator
Generates enterprise-grade PDF invoices with modern design and professional styling.
"""
import io
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line
from reportlab.graphics import renderPDF


# BAHub Brand Colors
PRIMARY_COLOR = colors.HexColor('#111827')      # Dark gray
ACCENT_COLOR = colors.HexColor('#2563EB')       # Blue
SECONDARY_COLOR = colors.HexColor('#6D5DFB')    # Purple
SUCCESS_COLOR = colors.HexColor('#16A34A')      # Green
LIGHT_BG = colors.HexColor('#F8FAFC')           # Light background
BORDER_COLOR = colors.HexColor('#E5E7EB')       # Border
TEXT_MUTED = colors.HexColor('#6B7280')         # Muted text
TEXT_DARK = colors.HexColor('#374151')          # Dark text


def add_watermark(canvas_obj, doc):
    """Add subtle BAHub watermark to the page"""
    canvas_obj.saveState()
    canvas_obj.setFillColor(colors.HexColor('#EEEEEE'))
    canvas_obj.setFillAlpha(0.05)
    canvas_obj.setFont('Helvetica-Bold', 120)
    canvas_obj.translate(A4[0] / 2, A4[1] / 2)
    canvas_obj.rotate(45)
    canvas_obj.drawCentredString(0, 0, 'BAHub')
    canvas_obj.restoreState()


def create_custom_styles():
    """Create premium typography styles"""
    styles = {}

    styles['hero_title'] = ParagraphStyle(
        'HeroTitle',
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=PRIMARY_COLOR,
        spaceAfter=2,
    )
    styles['hero_subtitle'] = ParagraphStyle(
        'HeroSubtitle',
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=TEXT_MUTED,
        spaceAfter=0,
    )
    styles['section_label'] = ParagraphStyle(
        'SectionLabel',
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=10,
        textColor=TEXT_MUTED,
        spaceAfter=4,
        spaceBefore=0,
        letterSpacing=1.2,
    )
    styles['card_key'] = ParagraphStyle(
        'CardKey',
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=TEXT_MUTED,
    )
    styles['card_value'] = ParagraphStyle(
        'CardValue',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=14,
        textColor=PRIMARY_COLOR,
    )
    styles['card_value_accent'] = ParagraphStyle(
        'CardValueAccent',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=14,
        textColor=ACCENT_COLOR,
    )
    styles['amount_large'] = ParagraphStyle(
        'AmountLarge',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=26,
        textColor=PRIMARY_COLOR,
    )
    styles['thank_you'] = ParagraphStyle(
        'ThankYou',
        fontName='Helvetica',
        fontSize=10,
        leading=16,
        textColor=TEXT_DARK,
    )
    styles['footer_text'] = ParagraphStyle(
        'FooterText',
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
    )
    styles['table_header'] = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=12,
        textColor=TEXT_MUTED,
        letterSpacing=0.8,
    )
    styles['table_cell'] = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=TEXT_DARK,
    )
    styles['table_total'] = ParagraphStyle(
        'TableTotal',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=PRIMARY_COLOR,
    )
    styles['feature_item'] = ParagraphStyle(
        'FeatureItem',
        fontName='Helvetica',
        fontSize=9,
        leading=16,
        textColor=TEXT_DARK,
    )
    styles['status_badge'] = ParagraphStyle(
        'StatusBadge',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=SUCCESS_COLOR,
        alignment=TA_CENTER,
    )
    styles['timeline_label'] = ParagraphStyle(
        'TimelineLabel',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=14,
        textColor=PRIMARY_COLOR,
    )
    styles['timeline_sub'] = ParagraphStyle(
        'TimelineSub',
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=TEXT_MUTED,
    )
    return styles


def make_divider():
    """Thin horizontal rule"""
    d = Drawing(520, 1)
    d.add(Line(0, 0, 520, 0, strokeColor=BORDER_COLOR, strokeWidth=0.8))
    return d


def make_card_table(rows, col_widths, bg=None):
    """Create a styled info card table"""
    t = Table(rows, colWidths=col_widths)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, -1), bg or LIGHT_BG),
        ('ROUNDEDCORNERS', [8]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER_COLOR),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


def build_header_section(payment, styles):
    """Hero header: BAHub brand left, success badge right"""
    elements = []

    # Company name + document type
    left_top = Paragraph('<font size="16"><b>BAHub</b></font>', ParagraphStyle(
        'Brand', fontName='Helvetica-Bold', fontSize=16, textColor=PRIMARY_COLOR, leading=20,
    ))
    left_sub = Paragraph('Payment Receipt', styles['hero_subtitle'])

    # Success badge (green pill)
    success_badge = Paragraph(
        '<font color="#16A34A"><b>✔  Payment Successful</b></font>',
        ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10,
                       textColor=SUCCESS_COLOR, alignment=TA_RIGHT, leading=14),
    )
    receipt_label = Paragraph(
        f'<font color="#6B7280">{payment.receipt_number}</font>',
        ParagraphStyle('RLabel', fontName='Helvetica', fontSize=8,
                       textColor=TEXT_MUTED, alignment=TA_RIGHT, leading=12),
    )

    header_data = [[
        [left_top, Spacer(1, 2), left_sub],
        [success_badge, Spacer(1, 2), receipt_label]
    ]]
    header_t = Table(header_data, colWidths=[310, 210])
    header_t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_t)
    elements.append(Spacer(1, 10))

    thank_you = Paragraph(
        'Thank you for choosing BAHub. Your subscription has been successfully activated.',
        styles['thank_you']
    )
    elements.append(thank_you)
    elements.append(Spacer(1, 14))
    elements.append(make_divider())
    elements.append(Spacer(1, 18))
    return elements


def build_info_cards(payment, styles):
    """Two side-by-side cards: Customer and Sold By"""
    elements = []

    # Section label
    elements.append(Paragraph('BILLING INFORMATION', styles['section_label']))
    elements.append(Spacer(1, 6))

    date_str = (payment.paid_at or payment.created_at).strftime('%B %d, %Y')

    # Customer card content
    customer_rows = [
        [Paragraph('👤  CUSTOMER', ParagraphStyle(
            'CHead', fontName='Helvetica-Bold', fontSize=7, textColor=ACCENT_COLOR,
            leading=10, letterSpacing=1.0,
        )), ''],
        [Paragraph('Organization', styles['card_key']),
         Paragraph(payment.organization.name, styles['card_value'])],
        [Paragraph('Plan', styles['card_key']),
         Paragraph(f'BAHub {payment.plan.capitalize()}', styles['card_value'])],
        [Paragraph('Billing Cycle', styles['card_key']),
         Paragraph(payment.billing_cycle.capitalize(), styles['card_value'])],
        [Paragraph('Payment Date', styles['card_key']),
         Paragraph(date_str, styles['card_value'])],
    ]
    customer_t = Table(customer_rows, colWidths=[90, 135])
    customer_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('SPAN', (0, 0), (1, 0)),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (1, 0), 0.5, BORDER_COLOR),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]))

    # Sold By card content
    sold_rows = [
        [Paragraph('🏢  SOLD BY', ParagraphStyle(
            'SHead', fontName='Helvetica-Bold', fontSize=7, textColor=SECONDARY_COLOR,
            leading=10, letterSpacing=1.0,
        )), ''],
        [Paragraph('Company', styles['card_key']),
         Paragraph('BAHub Platforms Inc.', styles['card_value'])],
        [Paragraph('Address', styles['card_key']),
         Paragraph('100 Enterprise Way, Suite 500\nSan Francisco, CA 94107', styles['card_value'])],
        [Paragraph('Support', styles['card_key']),
         Paragraph('bahubofficial@gmail.com', styles['card_value_accent'])],
        [Paragraph('Website', styles['card_key']),
         Paragraph('www.bahub.com', styles['card_value_accent'])],
    ]
    sold_t = Table(sold_rows, colWidths=[80, 145])
    sold_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('SPAN', (0, 0), (1, 0)),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (1, 0), 0.5, BORDER_COLOR),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]))

    side_by_side = Table([[customer_t, sold_t]], colWidths=[255, 265])
    side_by_side.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('COLPADDING', (1, 0), (1, -1), 10),
    ]))

    elements.append(side_by_side)
    elements.append(Spacer(1, 22))
    return elements


def build_payment_summary(payment, styles):
    """Payment summary card with receipt, transaction, status info"""
    elements = []

    elements.append(Paragraph('PAYMENT SUMMARY', styles['section_label']))
    elements.append(Spacer(1, 6))

    date_str = (payment.paid_at or payment.created_at).strftime('%B %d, %Y at %H:%M UTC')
    txn_id = payment.transaction_id or payment.stripe_payment_intent or 'N/A'
    method = payment.payment_method or 'Card via Stripe'

    rows = [
        # Header row
        [Paragraph('FIELD', styles['table_header']),
         Paragraph('DETAILS', styles['table_header'])],
        # Data rows
        [Paragraph('▪  Receipt Number', styles['card_key']),
         Paragraph(payment.receipt_number, styles['card_value'])],
        [Paragraph('▪  Transaction ID', styles['card_key']),
         Paragraph(txn_id, styles['card_value'])],
        [Paragraph('▪  Payment Method', styles['card_key']),
         Paragraph(method, styles['card_value'])],
        [Paragraph('▪  Payment Date', styles['card_key']),
         Paragraph(date_str, styles['card_value'])],
        [Paragraph('▪  Currency', styles['card_key']),
         Paragraph(payment.currency or 'USD', styles['card_value'])],
        [Paragraph('▪  Gateway', styles['card_key']),
         Paragraph(payment.gateway or 'Stripe', styles['card_value'])],
        # Status with badge
        [Paragraph('▪  Status', styles['card_key']),
         Paragraph('<font color="#16A34A"><b>● Payment Successful</b></font>',
                   ParagraphStyle('InlineSuccess', fontName='Helvetica-Bold',
                                  fontSize=9, textColor=SUCCESS_COLOR, leading=14))],
    ]

    summary_t = Table(rows, colWidths=[200, 320])
    summary_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('LINEBELOW', (0, 0), (-1, 0), 0.8, BORDER_COLOR),
        ('LINEBELOW', (0, -1), (-1, -1), 0.4, BORDER_COLOR),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(summary_t)
    elements.append(Spacer(1, 22))
    return elements


def build_subscription_details(payment, styles):
    """Modern pricing table with subscription breakdown"""
    elements = []

    elements.append(Paragraph('SUBSCRIPTION DETAILS', styles['section_label']))
    elements.append(Spacer(1, 6))

    desc = f"BAHub {payment.plan.capitalize()} Subscription"

    rows = [
        # Header
        [Paragraph('DESCRIPTION', styles['table_header']),
         Paragraph('BILLING CYCLE', styles['table_header']),
         Paragraph('QTY', styles['table_header']),
         Paragraph('UNIT PRICE', styles['table_header']),
         Paragraph('TOTAL', styles['table_header'])],
        # Line item
        [Paragraph(desc, styles['table_cell']),
         Paragraph(payment.billing_cycle.capitalize(), styles['table_cell']),
         Paragraph('1', styles['table_cell']),
         Paragraph(f'${payment.amount}', styles['table_cell']),
         Paragraph(f'${payment.amount}', styles['table_cell'])],
    ]

    # Add tax/discount rows if applicable
    if payment.discount and payment.discount > 0:
        rows.append([
            Paragraph('', styles['table_cell']),
            Paragraph('', styles['table_cell']),
            Paragraph('', styles['table_cell']),
            Paragraph('Discount', styles['card_key']),
            Paragraph(f'−${payment.discount}', ParagraphStyle(
                'Discount', fontName='Helvetica', fontSize=9, textColor=SUCCESS_COLOR, leading=14
            ))
        ])

    if payment.tax and payment.tax > 0:
        rows.append([
            Paragraph('', styles['table_cell']),
            Paragraph('', styles['table_cell']),
            Paragraph('', styles['table_cell']),
            Paragraph('Taxes & GST', styles['card_key']),
            Paragraph(f'${payment.tax}', styles['table_cell'])
        ])

    # Total paid row
    rows.append([
        Paragraph('', styles['table_cell']),
        Paragraph('', styles['table_cell']),
        Paragraph('', styles['table_cell']),
        Paragraph('Total Paid', styles['table_total']),
        Paragraph(f'<b>${payment.amount}</b>', styles['table_total'])
    ])

    pricing_t = Table(rows, colWidths=[180, 100, 45, 100, 95])
    pricing_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, LIGHT_BG]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EFF6FF')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (-1, 0), 0.8, BORDER_COLOR),
        ('LINEBELOW', (0, -2), (-1, -2), 0.4, BORDER_COLOR),
        ('LINEBELOW', (0, -1), (-1, -1), 1.2, ACCENT_COLOR),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 1), (4, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(pricing_t)
    elements.append(Spacer(1, 22))
    return elements


def build_features_unlocked(payment, styles):
    """Features unlocked section in two columns"""
    elements = []

    plan = payment.plan.upper()

    base_features = [
        ('✔', 'Unlimited Projects'),
        ('✔', 'Team Collaboration'),
        ('✔', 'Export to PDF'),
        ('✔', 'Priority Support'),
    ]
    pro_features = [
        ('✔', 'AI Requirement Generation'),
        ('✔', 'AI Flow Diagrams'),
        ('✔', 'Advanced Analytics'),
        ('✔', 'Stakeholder Management'),
    ]
    enterprise_extras = [
        ('✔', 'SSO / SAML2 Integration'),
        ('✔', 'Custom Seat Limits'),
        ('✔', 'Dedicated Account Manager'),
        ('✔', 'SLA Guarantee'),
    ]

    if plan == 'ENTERPRISE':
        left_features = base_features + enterprise_extras[:2]
        right_features = pro_features + enterprise_extras[2:]
    else:
        left_features = base_features
        right_features = pro_features

    elements.append(Paragraph(f'FEATURES UNLOCKED — BAHub {plan} Plan', styles['section_label']))
    elements.append(Spacer(1, 6))

    def feature_cell(items):
        lines = []
        for icon, text in items:
            lines.append(Paragraph(
                f'<font color="#16A34A"><b>{icon}</b></font>  {text}',
                styles['feature_item']
            ))
        return lines

    feature_t = Table(
        [[feature_cell(left_features), feature_cell(right_features)]],
        colWidths=[260, 260]
    )
    feature_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEAFTER', (0, 0), (0, -1), 0.4, BORDER_COLOR),
    ]))

    elements.append(feature_t)
    elements.append(Spacer(1, 22))
    return elements


def build_timeline_and_status(payment, styles):
    """Subscription timeline + large green confirmation card side by side"""
    elements = []

    elements.append(Paragraph('SUBSCRIPTION TIMELINE', styles['section_label']))
    elements.append(Spacer(1, 6))

    paid_at = payment.paid_at or payment.created_at
    renewal_date = paid_at + timedelta(days=30)

    # Timeline entries: (dot_color, label, sublabel)
    timeline_steps = [
        (SUCCESS_COLOR,   'Purchase Completed',     paid_at.strftime('%B %d, %Y')),
        (ACCENT_COLOR,    'Subscription Activated', paid_at.strftime('%B %d, %Y at %H:%M UTC')),
        (SECONDARY_COLOR, 'Next Billing Date',      renewal_date.strftime('%B %d, %Y')),
        (PRIMARY_COLOR,   'Auto-Renewal',           'Subscription renews automatically'),
    ]

    # Build timeline as table: dot column | connector | content column
    tl_rows = []
    for i, (dot_color, label, sub) in enumerate(timeline_steps):
        dot_para = Paragraph(
            f'<font color="{dot_color.hexval()}">●</font>',
            ParagraphStyle('Dot', fontName='Helvetica-Bold', fontSize=12,
                           textColor=dot_color, leading=16, alignment=TA_CENTER)
        )
        content = [
            Paragraph(label, styles['timeline_label']),
            Paragraph(sub, styles['timeline_sub']),
        ]
        tl_rows.append([dot_para, content])

    tl_t = Table(tl_rows, colWidths=[28, 200])
    # Build alternating connector lines via row padding
    tl_style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        # Draw vertical connector between rows
        ('LINEAFTER', (0, 0), (0, -2), 1.2, BORDER_COLOR),
    ]
    tl_t.setStyle(TableStyle(tl_style_cmds))

    # Right: Confirmation status card
    status_rows = [
        [Paragraph('<font color="#16A34A"><b>✔  Payment Confirmed</b></font>',
                   ParagraphStyle('ConfHead', fontName='Helvetica-Bold', fontSize=12,
                                  textColor=SUCCESS_COLOR, leading=18, alignment=TA_CENTER))],
        [Paragraph('Your subscription is active and ready to use.',
                   ParagraphStyle('ConfSub', fontName='Helvetica', fontSize=9,
                                  textColor=TEXT_MUTED, leading=14, alignment=TA_CENTER))],
        [Spacer(1, 6)],
        [Paragraph(f'<b>Plan:</b>  BAHub {payment.plan.capitalize()}',
                   ParagraphStyle('ConfDetail', fontName='Helvetica', fontSize=9,
                                  textColor=TEXT_DARK, leading=14, alignment=TA_CENTER))],
        [Paragraph(f'<b>Activated:</b>  {paid_at.strftime("%B %d, %Y")}',
                   ParagraphStyle('ConfDetail2', fontName='Helvetica', fontSize=9,
                                  textColor=TEXT_DARK, leading=14, alignment=TA_CENTER))],
        [Paragraph(f'<b>Renews:</b>  {renewal_date.strftime("%B %d, %Y")}',
                   ParagraphStyle('ConfDetail3', fontName='Helvetica', fontSize=9,
                                  textColor=TEXT_DARK, leading=14, alignment=TA_CENTER))],
    ]
    status_card_t = Table(status_rows, colWidths=[230])
    status_card_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor('#BBF7D0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    outer = Table([[tl_t, status_card_t]], colWidths=[255, 265])
    outer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    elements.append(outer)
    elements.append(Spacer(1, 22))
    return elements


def build_footer(payment, styles):
    """Footer with support info and legal links"""
    elements = []
    elements.append(make_divider())
    elements.append(Spacer(1, 12))

    footer_t = Table([[
        Paragraph('Thank you for choosing <b>BAHub</b>.',
                  ParagraphStyle('FL', fontName='Helvetica', fontSize=8,
                                 textColor=TEXT_MUTED, leading=12, alignment=TA_LEFT)),
        Paragraph(
            'Need help?  bahubofficial@gmail.com  ·  www.bahub.com\n'
            'Privacy Policy  ·  Terms of Service  ·  © BAHub Platforms Inc.',
            ParagraphStyle('FR', fontName='Helvetica', fontSize=7.5,
                           textColor=TEXT_MUTED, leading=12, alignment=TA_RIGHT)
        )
    ]], colWidths=[260, 260])
    footer_t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (0, -1), 0),
        ('RIGHTPADDING', (-1, 0), (-1, -1), 0),
    ]))
    elements.append(footer_t)
    return elements


def generate_invoice_pdf_content(payment):
    """
    Generates a premium enterprise-grade PDF receipt.
    Returns bytes of the generated PDF.
    All dynamic data comes from the Payment model instance.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"BAHub Payment Receipt {payment.receipt_number}",
        author="BAHub Platforms Inc.",
        subject=f"Payment Receipt — BAHub {payment.plan.capitalize()} Subscription",
    )

    styles = create_custom_styles()
    elements = []

    # ── Header ──────────────────────────────────────────────────────────────
    elements.extend(build_header_section(payment, styles))

    # ── Info Cards (Customer + Sold By) ─────────────────────────────────────
    elements.extend(build_info_cards(payment, styles))

    # ── Payment Summary ──────────────────────────────────────────────────────
    elements.extend(build_payment_summary(payment, styles))

    # ── Subscription Details (pricing table) ────────────────────────────────
    elements.extend(build_subscription_details(payment, styles))

    # ── Features Unlocked ───────────────────────────────────────────────────
    elements.extend(build_features_unlocked(payment, styles))

    # ── Timeline + Status Card ───────────────────────────────────────────────
    elements.extend(build_timeline_and_status(payment, styles))

    # ── Footer ───────────────────────────────────────────────────────────────
    elements.extend(build_footer(payment, styles))

    doc.build(elements, onFirstPage=add_watermark, onLaterPages=add_watermark)

    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
