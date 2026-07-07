import json
import copy
import logging
from strategic.executor import call_llm

logger = logging.getLogger(__name__)

# ─── Fallback templates ───────────────────────────────────────────────────────
# Used only when LLM API is unavailable. Represent clean canonical examples.

MOCK_TEMPLATES = {
    "USE_CASE": {
        "nodes": [
            {"id": "bound1", "type": "boundary", "position": {"x": 200, "y": 30}, "data": {"label": "System Boundary", "description": "Defines the scope of the system under design", "shape": "Boundary", "color": "indigo", "icon": "Square", "status": "APPROVED", "version": "1.0"}},
            {"id": "a1", "type": "actor", "position": {"x": 30, "y": 180}, "data": {"label": "Customer", "description": "Primary user who interacts with the system", "shape": "Actor", "color": "purple", "icon": "User", "priority": "HIGH", "status": "APPROVED", "version": "1.0"}},
            {"id": "a2", "type": "actor", "position": {"x": 680, "y": 180}, "data": {"label": "Admin", "description": "Back-office operator managing catalogue and orders", "shape": "Actor", "color": "rose", "icon": "UserCheck", "priority": "HIGH", "status": "APPROVED", "version": "1.0"}},
            {"id": "uc1", "type": "system", "position": {"x": 260, "y": 100}, "data": {"label": "Register / Login", "description": "User creates or authenticates into an account", "shape": "UseCase", "color": "indigo", "icon": "LogIn", "priority": "HIGH", "status": "APPROVED", "version": "1.0"}},
            {"id": "uc2", "type": "system", "position": {"x": 440, "y": 100}, "data": {"label": "Browse Catalogue", "description": "Search and filter available items", "shape": "UseCase", "color": "indigo", "icon": "Search", "priority": "MEDIUM", "status": "APPROVED", "version": "1.0"}},
            {"id": "uc3", "type": "system", "position": {"x": 260, "y": 220}, "data": {"label": "Add to Cart", "description": "Select items and store in session cart", "shape": "UseCase", "color": "indigo", "icon": "ShoppingCart", "priority": "HIGH", "status": "APPROVED", "version": "1.0"}},
            {"id": "uc4", "type": "system", "position": {"x": 440, "y": 220}, "data": {"label": "Checkout & Pay", "description": "Review order and complete payment", "shape": "UseCase", "color": "indigo", "icon": "CreditCard", "priority": "HIGH", "status": "REVIEW", "version": "1.0"}},
            {"id": "uc5", "type": "system", "position": {"x": 350, "y": 330}, "data": {"label": "Track Order", "description": "View real-time delivery status", "shape": "UseCase", "color": "indigo", "icon": "MapPin", "priority": "MEDIUM", "status": "APPROVED", "version": "1.0"}},
            {"id": "uc6", "type": "system", "position": {"x": 540, "y": 330}, "data": {"label": "Manage Catalogue", "description": "Admin adds, edits, or removes products", "shape": "UseCase", "color": "amber", "icon": "Package", "priority": "HIGH", "status": "APPROVED", "version": "1.0"}},
        ],
        "edges": [
            {"id": "e1", "source": "a1", "target": "uc1", "label": "initiates", "animated": False},
            {"id": "e2", "source": "a1", "target": "uc2", "label": "initiates", "animated": False},
            {"id": "e3", "source": "a1", "target": "uc3", "label": "initiates", "animated": False},
            {"id": "e4", "source": "a1", "target": "uc4", "label": "initiates", "animated": False},
            {"id": "e5", "source": "a1", "target": "uc5", "label": "initiates", "animated": False},
            {"id": "e6", "source": "a2", "target": "uc6", "label": "initiates", "animated": False},
            {"id": "e7", "source": "uc3", "target": "uc4", "label": "«includes»", "animated": False},
            {"id": "e8", "source": "uc4", "target": "uc5", "label": "«extends»", "animated": False},
        ]
    },
    "BPMN": {
        "nodes": [
            {"id": "n1", "type": "event",   "position": {"x": 50,  "y": 150}, "data": {"label": "Order Received",              "description": "Triggered when cart payment completes",         "shape": "Event",   "color": "emerald", "icon": "PlayCircle",  "status": "APPROVED"}},
            {"id": "n2", "type": "process", "position": {"x": 200, "y": 135}, "data": {"label": "Verify Inventory",             "description": "Check if requested items are in stock",         "shape": "Process", "color": "indigo",  "icon": "CheckSquare","status": "DRAFT"}},
            {"id": "n3", "type": "gateway", "position": {"x": 370, "y": 140}, "data": {"label": "In Stock?",                    "description": "Branch based on inventory availability",        "shape": "Gateway", "color": "amber",   "icon": "GitBranch",  "status": "REVIEW"}},
            {"id": "n4", "type": "process", "position": {"x": 500, "y": 50},  "data": {"label": "Pack & Dispatch Items",        "description": "Warehouse team packages and labels items",      "shape": "Process", "color": "indigo",  "icon": "Package",    "status": "APPROVED"}},
            {"id": "n5", "type": "process", "position": {"x": 500, "y": 230}, "data": {"label": "Notify Customer: Out of Stock","description": "Send automated out-of-stock email notification","shape": "Process", "color": "rose",    "icon": "Mail",       "status": "APPROVED"}},
            {"id": "n6", "type": "event",   "position": {"x": 660, "y": 150}, "data": {"label": "Fulfilment Complete",          "description": "End of fulfilment process lifecycle",           "shape": "Event",   "color": "emerald", "icon": "StopCircle", "status": "APPROVED"}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "label": "",    "animated": True},
            {"id": "e2", "source": "n2", "target": "n3", "label": "",    "animated": False},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Yes", "animated": False},
            {"id": "e4", "source": "n3", "target": "n5", "label": "No",  "animated": False},
            {"id": "e5", "source": "n4", "target": "n6", "label": "",    "animated": True},
            {"id": "e6", "source": "n5", "target": "n6", "label": "",    "animated": False},
        ]
    },
    "SEQUENCE": {
        "nodes": [
            {"id": "p1", "type": "actor",    "position": {"x": 80,  "y": 50}, "data": {"label": "Customer",         "shape": "Actor",    "color": "purple",  "icon": "User",     "status": "APPROVED"}},
            {"id": "p2", "type": "system",   "position": {"x": 260, "y": 50}, "data": {"label": "Web Portal",       "shape": "System",   "color": "indigo",  "icon": "Globe",    "status": "APPROVED"}},
            {"id": "p3", "type": "server",   "position": {"x": 440, "y": 50}, "data": {"label": "API Service",      "shape": "Server",   "color": "indigo",  "icon": "Cpu",      "status": "APPROVED"}},
            {"id": "p4", "type": "database", "position": {"x": 620, "y": 50}, "data": {"label": "Database",         "shape": "Database", "color": "emerald", "icon": "Database", "status": "APPROVED"}},
        ],
        "edges": [
            {"id": "s1", "source": "p1", "target": "p2", "label": "1. Submit request",           "animated": False},
            {"id": "s2", "source": "p2", "target": "p3", "label": "2. POST /api/resource",        "animated": True},
            {"id": "s3", "source": "p3", "target": "p4", "label": "3. INSERT record",             "animated": False},
            {"id": "s4", "source": "p4", "target": "p3", "label": "4. Confirm saved",             "animated": False},
            {"id": "s5", "source": "p3", "target": "p2", "label": "5. HTTP 201 Created",          "animated": True},
            {"id": "s6", "source": "p2", "target": "p1", "label": "6. Display success response",  "animated": False},
        ]
    },
    "ERD": {
        "nodes": [
            {"id": "e1", "type": "database", "position": {"x": 80,  "y": 150}, "data": {"label": "Customer",   "description": "PK: customer_id\n- first_name VARCHAR\n- last_name VARCHAR\n- email VARCHAR UNIQUE\n- created_at TIMESTAMP", "shape": "Database", "color": "purple",  "icon": "User",     "status": "APPROVED"}},
            {"id": "e2", "type": "database", "position": {"x": 360, "y": 150}, "data": {"label": "Order",      "description": "PK: order_id\nFK: customer_id\n- order_date TIMESTAMP\n- status ENUM\n- total_amount DECIMAL",          "shape": "Database", "color": "indigo",  "icon": "FileText", "status": "APPROVED"}},
            {"id": "e3", "type": "database", "position": {"x": 640, "y": 80},  "data": {"label": "OrderItem",  "description": "PK: item_id\nFK: order_id, product_id\n- quantity INT\n- unit_price DECIMAL",                          "shape": "Database", "color": "emerald", "icon": "List",     "status": "APPROVED"}},
            {"id": "e4", "type": "database", "position": {"x": 640, "y": 260}, "data": {"label": "Product",    "description": "PK: product_id\n- name VARCHAR\n- price DECIMAL\n- stock_count INT",                                  "shape": "Database", "color": "amber",   "icon": "Package",  "status": "APPROVED"}},
        ],
        "edges": [
            {"id": "r1", "source": "e1", "target": "e2", "label": "1 to Many (Places)",    "animated": False},
            {"id": "r2", "source": "e2", "target": "e3", "label": "1 to Many (Contains)",  "animated": False},
            {"id": "r3", "source": "e4", "target": "e3", "label": "1 to Many (Appears in)","animated": False},
        ]
    }
}


def clean_llm_json(response_text: str) -> str | None:
    """Strip markdown fences from LLM output to extract raw JSON."""
    if not response_text:
        return None
    cleaned = response_text.strip()
    for fence in ("```json", "```"):
        if cleaned.startswith(fence):
            cleaned = cleaned[len(fence):]
            break
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def _build_type_guidance(diagram_type: str) -> str:
    dt = diagram_type.upper()
    if "USE" in dt and "CASE" in dt:
        return (
            "This is a UML USE CASE diagram. Strict rules:\n"
            "- Actors MUST use type='actor', shape='Actor'. Place on left (primary) and right (secondary/admin).\n"
            "- Use Cases MUST use type='system', shape='UseCase'. Cluster inside the system boundary.\n"
            "- System Boundary: include exactly one type='boundary', shape='Boundary' node as a container label.\n"
            "- Edge labels: 'initiates', '«includes»', '«extends»', 'communicates with'.\n"
            "- Layout: actors at x≈50 (left) or x≈700 (right), use cases spread between x=220–580, y staggered by 110.\n"
            "- Generate minimum: 2 actors + 6 use cases. Name every node specifically for the domain."
        )
    if "BPMN" in dt:
        return (
            "This is a BPMN 2.0 diagram. Strict rules:\n"
            "- Start event: type='event', icon='PlayCircle', color='emerald'.\n"
            "- Tasks: type='process', icon appropriate to action.\n"
            "- Decisions: type='gateway', icon='GitBranch', color='amber'. Label branches 'Yes'/'No'.\n"
            "- End event: type='event', icon='StopCircle', color='emerald'.\n"
            "- Layout strictly left-to-right, x increments ~150px. No overlapping nodes."
        )
    if "SEQUENCE" in dt:
        return (
            "This is a UML SEQUENCE diagram. Strict rules:\n"
            "- Participants (lifelines) go at the top in a horizontal row, x increments of 200px, y=50.\n"
            "- Messages are edges numbered sequentially: '1. ...', '2. ...'\n"
            "- Show request messages going right, response messages going left.\n"
            "- Types: 'actor', 'system', 'server', 'database' for lifelines."
        )
    if "ERD" in dt or "ENTITY" in dt or "RELAT" in dt:
        return (
            "This is an Entity Relationship Diagram. Strict rules:\n"
            "- All entities: type='database', shape='Database'.\n"
            "- Entity description should list: PK field, FK fields, key attributes with SQL types.\n"
            "- Edge labels: '1 to Many (verb)', 'Many to Many (verb)', '1 to 1 (verb)'.\n"
            "- Lay out entities horizontally with x increments of ~280px."
        )
    if "SYSTEM" in dt and "CONTEXT" in dt:
        return (
            "This is a System Context Diagram. Rules:\n"
            "- One central system node (type='system') at center (x=350, y=200).\n"
            "- External actors/systems (type='actor') surrounding it at cardinal positions.\n"
            "- Edge labels describe data flows in both directions."
        )
    if "JOURNEY" in dt or "CUSTOMER" in dt:
        return (
            "This is a Customer Journey Map. Rules:\n"
            "- Horizontal stages as type='process' nodes left-to-right.\n"
            "- Each stage has child type='text' nodes below showing touchpoints and emotions.\n"
            "- Use colors: awareness=blue, consideration=indigo, purchase=emerald, retention=amber."
        )
    return (
        "This is a Business Process Diagram. Use type='event' for start/end, "
        "type='process' for tasks, type='gateway' for decisions. Layout left-to-right."
    )


def generate_ai_diagram(diagram_type: str, source_type: str, source_text: str) -> dict:
    """
    Generate a diagram using the LLM. Falls back to a templated mock if the
    LLM API is unavailable or returns unparseable output.
    """

    type_guidance = _build_type_guidance(diagram_type)

    system_instruction = (
        "You are a senior Enterprise Architect and certified Business Analyst. "
        "Generate a COMPLETE, DOMAIN-SPECIFIC diagram in valid JSON. "
        "Output ONLY a JSON object — no prose, no markdown fences outside the JSON itself.\n\n"
        f"DIAGRAM TYPE RULES:\n{type_guidance}\n\n"
        "OUTPUT JSON SCHEMA:\n"
        "{\n"
        '  "nodes": [\n'
        '    {"id": "n1", "type": "<type>", "position": {"x": 100, "y": 200},\n'
        '     "data": {"label": "...", "description": "...", "shape": "...",\n'
        '              "color": "<tailwind name>", "icon": "<lucide-react name>",\n'
        '              "priority": "HIGH|MEDIUM|LOW", "status": "DRAFT|REVIEW|APPROVED",\n'
        '              "version": "1.0", "owner": "..."}}\n'
        "  ],\n"
        '  "edges": [\n'
        '    {"id": "e1", "source": "n1", "target": "n2", "label": "...", "animated": false}\n'
        "  ],\n"
        '  "documentation": "# Purpose\\n...\\n# Scope\\n...\\n# Actors\\n...\\n# Business Rules\\n..."\n'
        "}\n\n"
        "RULES: All node labels and descriptions must be specific to the user's domain. "
        "No generic names like 'Node 1' or 'System A'. "
        "Minimum 6 nodes. Positions must not overlap (space at least 120px apart)."
    )

    prompt = (
        f"Generate a complete {diagram_type} diagram for this scenario:\n\n"
        f"{source_text}\n\n"
        "Every label must reflect the actual domain described above."
    )

    try:
        raw = call_llm(prompt, system_instruction)
        if raw:
            cleaned = clean_llm_json(raw)
            parsed = json.loads(cleaned)
            if isinstance(parsed.get("nodes"), list) and isinstance(parsed.get("edges"), list):
                if "documentation" not in parsed:
                    parsed["documentation"] = f"# {diagram_type} — AI Generated\n\nGenerated from: {source_text[:200]}"
                return parsed
    except Exception as exc:
        logger.warning("LLM diagram generation failed, using fallback template: %s", exc)

    # ── Fallback: pick the best matching template ─────────────────────────────
    dt = diagram_type.upper()
    if "USE" in dt and "CASE" in dt:
        key = "USE_CASE"
    elif "BPMN" in dt or "PROCESS" in dt or "FLOW" in dt:
        key = "BPMN"
    elif "SEQUENCE" in dt:
        key = "SEQUENCE"
    elif "ERD" in dt or "ENTITY" in dt or "RELAT" in dt:
        key = "ERD"
    elif "JOURNEY" in dt or "CUSTOMER" in dt:
        key = "BPMN"
    else:
        key = "BPMN"

    template = copy.deepcopy(MOCK_TEMPLATES.get(key, MOCK_TEMPLATES["BPMN"]))
    domain = source_text[:120] if source_text else diagram_type

    doc = (
        f"# {diagram_type} — Fallback Template\n\n"
        f"## Purpose\nProvides a structured {diagram_type} visualization.\n"
        f"**User request:** {domain}\n\n"
        "## Note\nThis is a fallback template. "
        "Configure an LLM API key (Gemini or OpenAI) in your `.env` for fully "
        "domain-specific AI generation.\n\n"
        "## Scope\nCaptures key actors, processes, and their interactions.\n\n"
        "## Business Rules\n- All requests must pass authentication.\n"
        "- System enforces domain-specific validation before committing state changes.\n"
    )

    return {
        "nodes": template["nodes"],
        "edges": template["edges"],
        "documentation": doc,
    }
