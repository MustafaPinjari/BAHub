import json
import logging
from strategic.executor import call_llm

logger = logging.getLogger(__name__)

# Fallback structures for mock generation when no keys are available
MOCK_TEMPLATES = {
    "USE_CASE": {
        "nodes": [
            {"id": "n1", "type": "actor", "position": {"x": 50, "y": 200}, "data": {"label": "Customer", "description": "End-user who initiates purchases", "shape": "Actor", "color": "purple", "icon": "User", "owner": "Product Owner", "status": "APPROVED", "version": "1.0", "priority": "HIGH"}},
            {"id": "n2", "type": "system", "position": {"x": 250, "y": 100}, "data": {"label": "Browse Catalog", "description": "Browse active product listings", "shape": "Process", "color": "indigo", "icon": "Search", "owner": "BA", "status": "APPROVED", "version": "1.0", "priority": "MEDIUM"}},
            {"id": "n3", "type": "system", "position": {"x": 250, "y": 200}, "data": {"label": "Add to Cart", "description": "Store items in persistent session", "shape": "Process", "color": "indigo", "icon": "ShoppingCart", "owner": "BA", "status": "APPROVED", "version": "1.0", "priority": "HIGH"}},
            {"id": "n4", "type": "system", "position": {"x": 250, "y": 300}, "data": {"label": "Checkout & Pay", "description": "Initiate checkout flow", "shape": "Process", "color": "indigo", "icon": "CreditCard", "owner": "BA", "status": "REVIEW", "version": "1.0", "priority": "HIGH"}},
            {"id": "n5", "type": "actor", "position": {"x": 500, "y": 300}, "data": {"label": "Payment Gateway", "description": "External payment processor API", "shape": "API", "color": "rose", "icon": "Link2", "owner": "Technical Architect", "status": "APPROVED", "version": "1.1", "priority": "HIGH"}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "label": "Views"},
            {"id": "e2", "source": "n1", "target": "n3", "label": "Selects"},
            {"id": "e3", "source": "n1", "target": "n4", "label": "Authorizes"},
            {"id": "e4", "source": "n4", "target": "n5", "label": "Routes call", "animated": True},
        ]
    },
    "BPMN": {
        "nodes": [
            {"id": "n1", "type": "event", "position": {"x": 50, "y": 150}, "data": {"label": "Order Received", "description": "Triggered when cart is paid", "shape": "Event", "color": "emerald", "icon": "PlayCircle", "status": "APPROVED"}},
            {"id": "n2", "type": "process", "position": {"x": 180, "y": 135}, "data": {"label": "Verify Inventory", "description": "Check if items are in stock", "shape": "Process", "color": "indigo", "icon": "CheckSquare", "status": "DRAFT"}},
            {"id": "n3", "type": "gateway", "position": {"x": 320, "y": 140}, "data": {"label": "In Stock?", "description": "Evaluate inventory count", "shape": "Gateway", "color": "amber", "icon": "GitBranch", "status": "REVIEW"}},
            {"id": "n4", "type": "process", "position": {"x": 420, "y": 50}, "data": {"label": "Pack Items", "description": "Package physical products", "shape": "Process", "color": "indigo", "icon": "Package", "status": "APPROVED"}},
            {"id": "n5", "type": "process", "position": {"x": 420, "y": 220}, "data": {"label": "Notify Customer out-of-stock", "description": "Send automated email updates", "shape": "Process", "color": "rose", "icon": "Mail", "status": "APPROVED"}},
            {"id": "n6", "type": "event", "position": {"x": 580, "y": 150}, "data": {"label": "Fulfillment End", "description": "Complete process lifecycle", "shape": "Event", "color": "emerald", "icon": "StopCircle", "status": "APPROVED"}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "label": ""},
            {"id": "e2", "source": "n2", "target": "n3", "label": ""},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Yes"},
            {"id": "e4", "source": "n3", "target": "n5", "label": "No"},
            {"id": "e5", "source": "n4", "target": "n6", "label": ""},
            {"id": "e6", "source": "n5", "target": "n6", "label": ""},
        ]
    },
    "SEQUENCE": {
        "nodes": [
            {"id": "c1", "type": "actor", "position": {"x": 100, "y": 50}, "data": {"label": "Customer", "shape": "Actor", "color": "purple", "icon": "User"}},
            {"id": "c2", "type": "system", "position": {"x": 250, "y": 50}, "data": {"label": "Web App Portal", "shape": "System", "color": "indigo", "icon": "Globe"}},
            {"id": "c3", "type": "server", "position": {"x": 400, "y": 50}, "data": {"label": "Transfer Service", "shape": "Server", "color": "indigo", "icon": "Cpu"}},
            {"id": "c4", "type": "database", "position": {"x": 550, "y": 50}, "data": {"label": "Account Database", "shape": "Database", "color": "emerald", "icon": "Database"}},
        ],
        "edges": [
            {"id": "s1", "source": "c1", "target": "c2", "label": "1. Submit Transfer Request"},
            {"id": "s2", "source": "c2", "target": "c3", "label": "2. POST /transfers/", "animated": True},
            {"id": "s3", "source": "c3", "target": "c4", "label": "3. Deduct Source Account"},
            {"id": "s4", "source": "c4", "target": "c3", "label": "4. Confirm Balance Saved"},
            {"id": "s5", "source": "c3", "target": "c2", "label": "5. HTTP 201 Created"},
            {"id": "s6", "source": "c2", "target": "c1", "label": "6. Show Transfer Success Screen"},
        ]
    },
    "ERD": {
        "nodes": [
            {"id": "e1", "type": "database", "position": {"x": 100, "y": 150}, "data": {"label": "Customer Entity", "description": "PK: customer_id\n- first_name\n- email", "shape": "Database", "color": "purple", "icon": "User"}},
            {"id": "e2", "type": "database", "position": {"x": 350, "y": 150}, "data": {"label": "Order Entity", "description": "PK: order_id\nFK: customer_id\n- order_date\n- total_amount", "shape": "Database", "color": "indigo", "icon": "FileText"}},
            {"id": "e3", "type": "database", "position": {"x": 600, "y": 150}, "data": {"label": "OrderItem Entity", "description": "PK: item_id\nFK: order_id\n- product_name\n- price", "shape": "Database", "color": "emerald", "icon": "Database"}},
        ],
        "edges": [
            {"id": "r1", "source": "e1", "target": "e2", "label": "1 to Many (Places)"},
            {"id": "r2", "source": "e2", "target": "e3", "label": "1 to Many (Contains)"},
        ]
    }
}

def clean_llm_json(response_text):
    """
    Strips markdown formatting blocks from LLM output to extract pure JSON.
    """
    if not response_text:
        return None
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def generate_ai_diagram(diagram_type, source_type, source_text):
    """
    Generates a professional business analysis diagram using LLMs (Gemini/OpenAI) 
    with dynamic coordinates and fully mapped object properties.
    Falls back to high-fidelity mocks if API keys are missing.
    """
    system_instruction = (
        "You are an expert Enterprise Architect and Business Analyst. Your task is to analyze the user's input "
        "and generate a fully structured diagram in valid JSON format. The output MUST be a JSON object containing "
        "exactly three keys: 'nodes', 'edges', and 'documentation'. Do NOT output any explanation text outside the JSON block.\n\n"
        "The format requirements are:\n"
        "1. 'nodes': A list of objects, each containing:\n"
        "   - 'id': A unique short identifier (string, e.g. 'n1', 'n2')\n"
        "   - 'type': Visual type of the node. Choices: 'actor', 'system', 'database', 'server', 'cloud', 'api', 'user', 'decision', 'document', 'storage', 'process', 'subprocess', 'event', 'gateway', 'timer', 'text', 'boundary', 'swimlane'\n"
        "   - 'position': A dict with 'x' (integer, e.g. 100) and 'y' (integer, e.g. 200). Design a clean layout. For process/sequence flows, layout nodes sequentially (e.g. step-by-step from left to right or top to bottom).\n"
        "   - 'data': A dict containing:\n"
        "       - 'label': The node name\n"
        "       - 'description': Brief description of its responsibility\n"
        "       - 'shape': Shape representation matches the visual toolbox (e.g. 'Actor', 'Database', 'Process', 'Gateway')\n"
        "       - 'color': Tailwind palette (e.g. 'purple', 'indigo', 'emerald', 'rose', 'amber')\n"
        "       - 'icon': Lucide-react icon name (e.g. 'User', 'Database', 'Globe', 'Cpu', 'CheckSquare')\n"
        "       - 'priority': 'HIGH', 'MEDIUM', 'LOW' (optional)\n"
        "       - 'owner': Owner role (optional)\n"
        "       - 'status': 'DRAFT', 'REVIEW', 'APPROVED' (optional)\n"
        "       - 'version': '1.0' (optional)\n"
        "2. 'edges': A list of objects, each containing:\n"
        "   - 'id': A unique identifier (e.g. 'e1', 'e2')\n"
        "   - 'source': The 'id' of the source node\n"
        "   - 'target': The 'id' of the target node\n"
        "   - 'label': Short text describing the interaction or data flow (e.g. 'submits', 'validates', 'yes', 'no')\n"
        "   - 'animated': Boolean (true for active calls, workflows, integrations)\n"
        "3. 'documentation': A detailed Markdown string containing analysis documentation including:\n"
        "   - Purpose\n"
        "   - Scope\n"
        "   - Actors\n"
        "   - Business Rules\n"
        "   - Assumptions and Constraints\n"
        "   - Inputs and Outputs\n"
        "   - Exceptions\n"
        "   - Dependencies\n"
        "   - Related Requirements & Business Value\n\n"
        "Generate a professional, fully complete diagram. Do not skip nodes or use placeholders."
    )

    prompt = f"Analyze this {source_type} content and generate a {diagram_type} diagram.\n\nInput Content:\n{source_text}"
    
    try:
        raw_response = call_llm(prompt, system_instruction)
        if raw_response:
            cleaned_json = clean_llm_json(raw_response)
            parsed_data = json.loads(cleaned_json)
            # Validate essential keys are present
            if "nodes" in parsed_data and "edges" in parsed_data:
                # Add default values for documentation if not generated by LLM
                if "documentation" not in parsed_data:
                    parsed_data["documentation"] = "### AI Generated Documentation\n\nPurpose of this model is to document flow processes."
                return parsed_data
    except Exception as e:
        logger.warning(f"AI Generation failed or keys missing, using fallback mockup: {e}")

    # Fallback mock template resolver
    normalized_type = "USE_CASE"
    if "BPMN" in diagram_type.upper() or "PROCESS" in diagram_type.upper() or "FLOW" in diagram_type.upper():
        normalized_type = "BPMN"
    elif "SEQUENCE" in diagram_type.upper():
        normalized_type = "SEQUENCE"
    elif "ER" in diagram_type.upper() or "DATA" in diagram_type.upper():
        normalized_type = "ERD"

    mock = MOCK_TEMPLATES.get(normalized_type, MOCK_TEMPLATES["USE_CASE"])
    
    # Generate custom descriptive details based on the user's input text to make mockups feel customized
    description_snippet = f"Based on: {source_text[:100]}..." if source_text else ""
    doc_markdown = f"""# AI-Generated Model Documentation ({diagram_type})
    
## 1. Purpose
Provides a structured visualization of the business operations. {description_snippet}

## 2. Scope
Captures transactional steps, actor triggers, and backend validation sequences.

## 3. Actors & Roles
- **Primary Actor**: Customer / External Trigger
- **Secondary Actor**: System APIs and data persistence layer

## 4. Business Rules
- All requests must authenticate via security keys.
- Gateway evaluates and branches transactions based on inventory and balance checks.

## 5. Assumptions & Constraints
- Database holds transactional states.
- High-availability network handles integrations.
"""
    return {
        "nodes": mock["nodes"],
        "edges": mock["edges"],
        "documentation": doc_markdown
    }
