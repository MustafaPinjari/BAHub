import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

def export_to_mermaid(diagram_type, canvas_json):
    """
    Translates React Flow canvas JSON into standard Mermaid.js syntax.
    """
    nodes = canvas_json.get("nodes", [])
    edges = canvas_json.get("edges", [])
    
    diagram_type_upper = str(diagram_type).upper()

    if "SEQUENCE" in diagram_type_upper:
        lines = ["sequenceDiagram"]
        # Add participants
        for node in nodes:
            label = node.get("data", {}).get("label", "Actor")
            lines.append(f"    participant {node.get('id')} as {label}")
        # Add messages
        for edge in edges:
            src = edge.get("source")
            dst = edge.get("target")
            lbl = edge.get("label", "interacts")
            lines.append(f"    {src}->>{dst}: {lbl}")
        return "\n".join(lines)

    elif "ER" in diagram_type_upper:
        lines = ["erDiagram"]
        for node in nodes:
            label = node.get("data", {}).get("label", "Entity").replace(" ", "")
            desc = node.get("data", {}).get("description", "")
            fields = []
            for line in desc.split("\n"):
                if ":" in line or "-" in line:
                    fields.append(line.replace("-", "").strip().replace(":", " "))
            
            if fields:
                lines.append(f"    {label} {{")
                for field in fields:
                    lines.append(f"        string {field}")
                lines.append("    }")
            else:
                lines.append(f"    {label} {{}}")

        for edge in edges:
            src_node = next((n for n in nodes if n.get("id") == edge.get("source")), None)
            dst_node = next((n for n in nodes if n.get("id") == edge.get("target")), None)
            if src_node and dst_node:
                src_lbl = src_node.get("data", {}).get("label", "Entity1").replace(" ", "")
                dst_lbl = dst_node.get("data", {}).get("label", "Entity2").replace(" ", "")
                lines.append(f"    {src_lbl} ||--o{{ {dst_lbl} : \"{edge.get('label', 'has')}\"")
        return "\n".join(lines)

    else:
        # Default flow chart layout
        lines = ["graph TD"]
        for node in nodes:
            node_id = node.get("id")
            label = node.get("data", {}).get("label", "Node")
            shape = str(node.get("data", {}).get("shape", "")).upper()
            
            # Map shapes to Mermaid syntax
            if "ACTOR" in shape or "USER" in shape:
                lines.append(f"    {node_id}[\"👤 {label}\"]")
            elif "GATEWAY" in shape or "DECISION" in shape:
                lines.append(f"    {node_id}{{\"{label}\"}}")
            elif "DATABASE" in shape or "STORAGE" in shape:
                lines.append(f"    {node_id}[(\"🗄️ {label}\")]")
            elif "EVENT" in shape:
                lines.append(f"    {node_id}((\"{label}\"))")
            else:
                lines.append(f"    {node_id}[\"{label}\"]")

        for edge in edges:
            src = edge.get("source")
            dst = edge.get("target")
            lbl = edge.get("label", "")
            if lbl:
                lines.append(f"    {src} -->|{lbl}| {dst}")
            else:
                lines.append(f"    {src} --> {dst}")
        return "\n".join(lines)


def export_to_plantuml(diagram_type, canvas_json):
    """
    Translates React Flow canvas JSON into PlantUML syntax.
    """
    nodes = canvas_json.get("nodes", [])
    edges = canvas_json.get("edges", [])
    
    diagram_type_upper = str(diagram_type).upper()
    lines = ["@startuml", "skinparam monochrome false", "skinparam packageStyle rect"]

    if "SEQUENCE" in diagram_type_upper:
        for node in nodes:
            label = node.get("data", {}).get("label", "Actor")
            lines.append(f"actor \"{label}\" as {node.get('id')}")
        for edge in edges:
            lines.append(f"{edge.get('source')} -> {edge.get('target')} : {edge.get('label', 'interacts')}")

    elif "ER" in diagram_type_upper:
        for node in nodes:
            label = node.get("data", {}).get("label", "Entity").replace(" ", "")
            lines.append(f"entity \"{label}\" {{")
            desc = node.get("data", {}).get("description", "")
            for desc_line in desc.split("\n"):
                if desc_line.strip():
                    lines.append(f"  {desc_line.strip()}")
            lines.append("}")
        for edge in edges:
            src_node = next((n for n in nodes if n.get("id") == edge.get("source")), None)
            dst_node = next((n for n in nodes if n.get("id") == edge.get("target")), None)
            if src_node and dst_node:
                src_lbl = src_node.get("data", {}).get("label", "Entity1").replace(" ", "")
                dst_lbl = dst_node.get("data", {}).get("label", "Entity2").replace(" ", "")
                lines.append(f"{src_lbl} --|{{ {dst_lbl} : \"{edge.get('label', 'has')}\"")

    else:
        # Default Use Case / Activity Diagram representation
        for node in nodes:
            node_id = node.get("id")
            label = node.get("data", {}).get("label", "Node")
            shape = str(node.get("data", {}).get("shape", "")).upper()
            if "ACTOR" in shape:
                lines.append(f"actor \"{label}\" as {node_id}")
            elif "DATABASE" in shape:
                lines.append(f"database \"{label}\" as {node_id}")
            else:
                lines.append(f"usecase \"{label}\" as {node_id}")
        
        for edge in edges:
            lines.append(f"{edge.get('source')} --> {edge.get('target')} : \"{edge.get('label', '')}\"")

    lines.append("@enduml")
    return "\n".join(lines)


def export_to_drawio_xml(canvas_json):
    """
    Generates standard Draw.io / mxGraph XML configuration.
    """
    nodes = canvas_json.get("nodes", [])
    edges = canvas_json.get("edges", [])

    mxfile = ET.Element("mxfile", host="Electron", modified="2026-07-05T00:00:00.000Z", agent="BAHub Diagrams", version="20.0.0")
    diagram = ET.SubElement(mxfile, "diagram", id="d1", name="BAHub Architecture Model")
    mx_graph_model = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="827", pageHeight="1169")
    root = ET.SubElement(mx_graph_model, "root")
    
    # Standard initial drawio elements
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    # Add Nodes
    for node in nodes:
        node_id = node.get("id")
        label = node.get("data", {}).get("label", "Node")
        pos = node.get("position", {"x": 100, "y": 100})
        shape = str(node.get("data", {}).get("shape", "")).upper()
        
        # Styles
        style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#6366F1;strokeColor=#4F46E5;fontColor=#FFFFFF;"
        if "ACTOR" in shape:
            style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;"
        elif "DATABASE" in shape:
            style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#10B981;"
        elif "GATEWAY" in shape or "DECISION" in shape:
            style = "rhombus;whiteSpace=wrap;html=1;fillColor=#F59E0B;"

        cell = ET.SubElement(root, "mxCell", id=node_id, value=escape(label), style=style, vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(pos.get("x", 100)), y=str(pos.get("y", 100)), width="120", height="60", as_="geometry")

    # Add Edges
    for edge in edges:
        edge_id = edge.get("id")
        src = edge.get("source")
        dst = edge.get("target")
        lbl = edge.get("label", "")
        
        cell = ET.SubElement(root, "mxCell", id=edge_id, value=escape(lbl), style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#6366F1;strokeWidth=2;", edge="1", parent="1", source=src, target=dst)
        ET.SubElement(cell, "mxGeometry", relative="1", as_="geometry")

    return ET.tostring(mxfile, encoding="utf-8").decode("utf-8")


def export_to_bpmn_xml(canvas_json):
    """
    Generates standard BPMN 2.0 XML representation.
    """
    nodes = canvas_json.get("nodes", [])
    edges = canvas_json.get("edges", [])

    definitions = ET.Element(
        "bpmn:definitions",
        {
            "xmlns:bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
            "xmlns:bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
            "xmlns:dc": "http://www.omg.org/spec/DD/20100524/DC",
            "xmlns:di": "http://www.omg.org/spec/DD/20100524/DI",
            "id": "Definitions_1",
            "targetNamespace": "http://bpmn.io/schema/bpmn"
        }
    )

    process = ET.SubElement(definitions, "bpmn:process", id="Process_1", isExecutable="false")

    # Group nodes by type
    start_events = []
    end_events = []
    tasks = []
    gateways = []

    for node in nodes:
        node_id = node.get("id")
        label = node.get("data", {}).get("label", "Step")
        shape = str(node.get("data", {}).get("shape", "")).upper()
        ntype = str(node.get("type", "")).upper()

        if "EVENT" in ntype or "EVENT" in shape:
            lbl_lower = label.lower()
            if "start" in lbl_lower or "receive" in lbl_lower:
                start_events.append((node_id, label))
            else:
                end_events.append((node_id, label))
        elif "GATEWAY" in ntype or "GATEWAY" in shape:
            gateways.append((node_id, label))
        else:
            tasks.append((node_id, label))

    # Add BPMN XML Elements
    for eid, name in start_events:
        ET.SubElement(process, "bpmn:startEvent", id=eid, name=escape(name))
    for eid, name in end_events:
        ET.SubElement(process, "bpmn:endEvent", id=eid, name=escape(name))
    for tid, name in tasks:
        ET.SubElement(process, "bpmn:task", id=tid, name=escape(name))
    for gid, name in gateways:
        ET.SubElement(process, "bpmn:exclusiveGateway", id=gid, name=escape(name))

    # Add Sequences
    for edge in edges:
        edge_id = edge.get("id")
        src = edge.get("source")
        dst = edge.get("target")
        lbl = edge.get("label", "")
        ET.SubElement(process, "bpmn:sequenceFlow", id=edge_id, name=escape(lbl), sourceRef=src, targetRef=dst)

    return ET.tostring(definitions, encoding="utf-8").decode("utf-8")
