from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from organizations.models import Organization
from .models import Diagram, DiagramVersion, DiagramObjectLink
from .validators import validate_diagram_json
from .exporters import export_to_mermaid, export_to_plantuml, export_to_drawio_xml, export_to_bpmn_xml

User = get_user_model()

class DiagramsTestCase(TestCase):
    def setUp(self):
        # Create organization
        self.org = Organization.objects.create(name="Enterprise Org")
        # Create user
        self.user = User.objects.create_user(
            username="analyst",
            email="analyst@enterprise.com",
            password="EnterprisePassword123!",
            organization=self.org,
            role="BUSINESS_ANALYST"
        )
        # Create project
        self.project = Project.objects.create(
            name="Alpha Project",
            organization=self.org
        )

    def test_diagram_creation_and_checkpoint(self):
        # 1. Create a diagram
        diagram = Diagram.objects.create(
            project=self.project,
            name="Payment Flow",
            diagram_type="BPMN",
            canvas_json={
                "nodes": [
                    {"id": "n1", "type": "event", "data": {"label": "Start", "shape": "Event"}},
                    {"id": "n2", "type": "process", "data": {"label": "Process Payment", "shape": "Process"}},
                ],
                "edges": [
                    {"id": "e1", "source": "n1", "target": "n2"}
                ]
            },
            created_by=self.user
        )
        
        self.assertEqual(diagram.name, "Payment Flow")
        self.assertEqual(diagram.status, "DRAFT")
        self.assertEqual(diagram.version, "1.0")

        # 2. Save a checkpoint
        version = DiagramVersion.objects.create(
            diagram=diagram,
            version="1.1",
            canvas_json=diagram.canvas_json,
            documentation="Detailed billing flow documentation.",
            created_by=self.user,
            checkpoint_name="Sprint 1 Milestone"
        )
        
        self.assertEqual(diagram.versions.count(), 1)
        self.assertEqual(version.version, "1.1")
        self.assertEqual(version.checkpoint_name, "Sprint 1 Milestone")

    def test_diagram_validation_engine(self):
        # Test empty canvas validation
        res_empty = validate_diagram_json({})
        self.assertEqual(res_empty["completeness_score"], 0)
        self.assertEqual(len(res_empty["issues"]), 1)
        self.assertEqual(res_empty["issues"][0]["category"], "Structure")

        # Test simple BPMN canvas validation
        canvas = {
            "nodes": [
                {"id": "n1", "type": "event", "data": {"label": "Start Process", "shape": "Event", "description": "Initiation point", "owner": "BA", "priority": "HIGH"}},
                {"id": "n2", "type": "process", "data": {"label": "Verify Payment", "shape": "Process", "description": "Verification step", "owner": "Finance", "priority": "MEDIUM"}},
                {"id": "n3", "type": "event", "data": {"label": "End Process", "shape": "Event", "description": "Termination point", "owner": "BA", "priority": "LOW"}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2"},
                {"id": "e2", "source": "n2", "target": "n3"}
            ]
        }
        
        res = validate_diagram_json(canvas, "Purpose: Document verify flow. Scope: Finance. Actor: Customer.")
        self.assertGreater(res["completeness_score"], 50)
        # Verify that since start and end event exist, no error is reported for start/end missing
        issues_categories = [issue["category"] for issue in res["issues"]]
        self.assertNotIn("BPMN Compliance", issues_categories)

    def test_diagram_exporters(self):
        canvas = {
            "nodes": [
                {"id": "n1", "type": "actor", "data": {"label": "Customer", "shape": "Actor"}},
                {"id": "n2", "type": "process", "data": {"label": "Submit Order", "shape": "Process"}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "label": "clicks"}
            ]
        }

        mermaid = export_to_mermaid("USE_CASE", canvas)
        self.assertIn("Customer", mermaid)
        self.assertIn("Submit Order", mermaid)

        plantuml = export_to_plantuml("USE_CASE", canvas)
        self.assertIn("@startuml", plantuml)
        self.assertIn("Customer", plantuml)

        drawio = export_to_drawio_xml(canvas)
        self.assertIn("mxfile", drawio)
        self.assertIn("Customer", drawio)

        bpmn = export_to_bpmn_xml(canvas)
        self.assertIn("bpmn:definitions", bpmn)
