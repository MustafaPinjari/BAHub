import datetime
import io
import markdown
from django.http import FileResponse
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from docx import Document

# Pure-python PDF library (robust across environments)
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from .models import BusinessDocument
from .serializers import BusinessDocumentSerializer
from projects.models import Project
from core.responses import api_success, api_error
from core.exceptions import ValidationError

class BusinessDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling BusinessDocument CRUD operations.
    Supports automated BRD/FRD generation and official sign-off workflows.
    """
    serializer_class = BusinessDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "generate_document"]:
            from billing.permissions import IsProOrEnterprise
            return [IsAuthenticated(), IsProOrEnterprise()]
        return [IsAuthenticated()]


    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return BusinessDocument.objects.none()

        queryset = BusinessDocument.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        # Support ?doc_type=BRD query filtering
        doc_type = self.request.query_params.get("doc_type")
        if doc_type:
            queryset = queryset.filter(doc_type=doc_type)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate_document(self, request):
        """
        Synthesizes a markdown BRD/FRD template.
        Gathers all stakeholders, requirements, and user stories.
        """
        project_id = request.data.get("project")
        doc_type = request.data.get("doc_type", "BRD")
        if not project_id:
            return api_error(message="Project ID is required.")

        try:
            project = Project.objects.get(
                id=project_id,
                organization_id=request.user.organization_id
            )
        except Project.DoesNotExist:
            return api_error(message="Project not found in your organization.")

        stakeholders = project.stakeholders.all()
        requirements = project.requirements.all()

        content = f"# Business Document: {doc_type} - {project.name}\n\n"
        content += "## 1. Document Control & Scope\n"
        content += f"- **Project Scope**: {project.name}\n"
        content += f"- **Workspace Organisation**: {project.organization.name}\n"
        content += f"- **Document Schema Type**: {doc_type}\n"
        content += f"- **Author**: @{request.user.username}\n"
        content += "- **Status**: DRAFT\n"
        content += f"- **Scope Description**: {project.description or 'No scope definition provided.'}\n\n"

        content += "## 2. Key Stakeholder Registry\n"
        if not stakeholders.exists():
            content += "*No stakeholders registered in this project.*\n\n"
        else:
            content += "| Name | Title | Department | Power / Interest |\n"
            content += "| --- | --- | --- | --- |\n"
            for s in stakeholders:
                content += f"| {s.name} | {s.title} | {s.department or 'N/A'} | {s.power} / {s.interest} |\n"
            content += "\n"

        content += "## 3. Business & Technical Specifications Catalog\n"
        if not requirements.exists():
            content += "*No specifications recorded in project backlog.*\n\n"
        else:
            content += "| ID | Title | Priority | Type | Status |\n"
            content += "| --- | --- | --- | --- | --- |\n"
            for r in requirements:
                content += f"| {r.req_id} | {r.title} | {r.priority} | {r.req_type} | {r.status} |\n"
            content += "\n"

        if doc_type == "FRD":
            content += "## 4. Agile Backlog & User Stories Traceability\n"
            from stories.models import UserStory
            stories = UserStory.objects.filter(requirement__project=project)
            if not stories.exists():
                content += "*No user story mappings found in backlog.*\n\n"
            else:
                content += "| Story ID | Title | Estimation | Status | Traced Requirement |\n"
                content += "| --- | --- | --- | --- | --- |\n"
                for s in stories:
                    content += f"| {s.story_id} | {s.title} | {s.points} pts | {s.status} | {s.requirement.req_id} |\n"
                content += "\n"

        title = f"{doc_type} - {project.name} - Version 1.0"

        data = {
            "project": str(project.id),
            "doc_type": doc_type,
            "title": title,
            "version": "1.0",
            "status": "DRAFT",
            "content": content,
        }

        return api_success(data=data, message="Document synthesized successfully.")

    @action(detail=True, methods=["post"], url_path="sign-off")
    def sign_off(self, request, pk=None):
        """
        Transitions document status to SIGNED_OFF.
        Restricted to Admins, Product Owners, and Project Managers.
        """
        doc = self.get_object()

        if request.user.role not in ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"]:
            return api_error(message="Only Product Owners, Project Managers, and Admins can sign off documents.")

        from django.utils import timezone
        doc.status = "SIGNED_OFF"
        doc.signed_off_by = request.user
        doc.signed_off_at = timezone.now()
        doc.save()

        serializer = self.get_serializer(doc)
        return api_success(data=serializer.data, message="Document signed off successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Documents retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Document details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Document created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Document updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Document deleted successfully.", status_code=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        document = self.get_object()
        pdf_io = io.BytesIO()
        self._generate_pdf_reportlab(document, pdf_io)
        pdf_io.seek(0)
        
        response = FileResponse(pdf_io, content_type='application/pdf')
        safe_title = "".join(x for x in document.title if x.isalnum() or x in "._- ")
        response['Content-Disposition'] = f'attachment; filename="{safe_title}.pdf"'
        return response

    @action(detail=True, methods=["get"], url_path="export-word")
    def export_word(self, request, pk=None):
        document = self.get_object()
        doc = self._markdown_to_docx(document.content)
        word_io = io.BytesIO()
        doc.save(word_io)
        word_io.seek(0)
        
        response = FileResponse(word_io, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        safe_title = "".join(x for x in document.title if x.isalnum() or x in "._- ")
        response['Content-Disposition'] = f'attachment; filename="{safe_title}.docx"'
        return response

    def _generate_pdf_reportlab(self, document, stream):
        doc = SimpleDocTemplate(stream, pagesize=A4, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=15
        )
        h2_style = ParagraphStyle(
            'DocH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#2563EB'),
            spaceBefore=15,
            spaceAfter=10
        )
        body_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            spaceAfter=8
        )
        bullet_style = ParagraphStyle(
            'DocBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            leftIndent=15,
            firstLineIndent=-10,
            textColor=colors.HexColor('#334155'),
            spaceAfter=4
        )
        
        lines = document.content.split('\n')
        table_rows = []
        in_table = False
        
        for line in lines:
            stripped = line.strip()
            
            if stripped.startswith('|'):
                in_table = True
                cells = [c.strip() for c in stripped.split('|')[1:-1]]
                if cells and all(c.startswith('-') for c in cells):
                    continue
                table_rows.append(cells)
                continue
            else:
                if in_table:
                    if table_rows:
                        formatted_rows = []
                        for row_idx, r_data in enumerate(table_rows):
                            formatted_row = []
                            for cell_val in r_data:
                                c_style = ParagraphStyle('Cell', parent=body_style, fontSize=8, leading=10)
                                if row_idx == 0:
                                    c_style = ParagraphStyle('HeaderCell', parent=body_style, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
                                formatted_row.append(Paragraph(cell_val, c_style))
                            formatted_rows.append(formatted_row)
                        
                        t = Table(formatted_rows)
                        t_style = [
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                            ('TOPPADDING', (0, 0), (-1, -1), 5),
                            ('LEFTPADDING', (0, 0), (-1, -1), 5),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                        ]
                        for r_idx in range(1, len(table_rows)):
                            if r_idx % 2 == 0:
                                t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor('#F8FAFC')))
                        t.setStyle(TableStyle(t_style))
                        story.append(t)
                        story.append(Spacer(1, 8))
                    table_rows = []
                    in_table = False
                    
            if not stripped:
                continue
                
            if stripped.startswith('# '):
                story.append(Paragraph(stripped[2:], title_style))
            elif stripped.startswith('## '):
                story.append(Paragraph(stripped[3:], h2_style))
            elif stripped.startswith('### '):
                story.append(Paragraph(stripped[4:], styles['Heading3']))
            elif stripped.startswith('- '):
                story.append(Paragraph(f"&bull; {stripped[2:]}", bullet_style))
            elif stripped.startswith('* '):
                story.append(Paragraph(f"&bull; {stripped[2:]}", bullet_style))
            else:
                story.append(Paragraph(stripped, body_style))
                
        if in_table and table_rows:
            formatted_rows = []
            for row_idx, r_data in enumerate(table_rows):
                formatted_row = []
                for cell_val in r_data:
                    c_style = ParagraphStyle('Cell', parent=body_style, fontSize=8, leading=10)
                    if row_idx == 0:
                        c_style = ParagraphStyle('HeaderCell', parent=body_style, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
                    formatted_row.append(Paragraph(cell_val, c_style))
                formatted_rows.append(formatted_row)
            t = Table(formatted_rows)
            t_style = [
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ]
            for r_idx in range(1, len(table_rows)):
                if r_idx % 2 == 0:
                    t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor('#F8FAFC')))
            t.setStyle(TableStyle(t_style))
            story.append(t)
            
        doc.build(story)

    def _markdown_to_docx(self, markdown_text):
        doc = Document()
        lines = markdown_text.split('\n')
        
        table_rows = []
        in_table = False
        
        for line in lines:
            stripped = line.strip()
            
            if stripped.startswith('|'):
                in_table = True
                cells = [c.strip() for c in stripped.split('|')[1:-1]]
                if cells and all(c.startswith('-') for c in cells):
                    continue
                table_rows.append(cells)
                continue
            else:
                if in_table:
                    if table_rows:
                        num_cols = len(table_rows[0])
                        table = doc.add_table(rows=0, cols=num_cols)
                        table.style = 'Table Grid'
                        for r_data in table_rows:
                            row_cells = table.add_row().cells
                            for col_idx, cell_value in enumerate(r_data):
                                if col_idx < len(row_cells):
                                    row_cells[col_idx].text = cell_value
                    table_rows = []
                    in_table = False

            if not stripped:
                continue
                
            if stripped.startswith('# '):
                doc.add_heading(stripped[2:], level=1)
            elif stripped.startswith('## '):
                doc.add_heading(stripped[3:], level=2)
            elif stripped.startswith('### '):
                doc.add_heading(stripped[4:], level=3)
            elif stripped.startswith('- '):
                doc.add_paragraph(stripped[2:], style='List Bullet')
            elif stripped.startswith('* '):
                doc.add_paragraph(stripped[2:], style='List Bullet')
            else:
                doc.add_paragraph(stripped)
                
        if in_table and table_rows:
            num_cols = len(table_rows[0])
            table = doc.add_table(rows=0, cols=num_cols)
            table.style = 'Table Grid'
            for r_data in table_rows:
                row_cells = table.add_row().cells
                for col_idx, cell_value in enumerate(r_data):
                    if col_idx < len(row_cells):
                        row_cells[col_idx].text = cell_value
                        
        return doc
