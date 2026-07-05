def validate_diagram_json(canvas_json, documentation_text=""):
    """
    Validates diagram canvas structure and outputs:
    - completeness_score (0-100)
    - compliance_score (0-100)
    - issues: list of validation items
    - recommendations: list of suggested improvements
    """
    nodes = canvas_json.get("nodes", [])
    edges = canvas_json.get("edges", [])

    issues = []
    recommendations = []

    # If diagram is completely empty
    if not nodes:
        return {
            "completeness_score": 0,
            "compliance_score": 0,
            "issues": [{
                "severity": "ERROR",
                "category": "Structure",
                "message": "The diagram canvas is empty. Add nodes to begin modeling."
            }],
            "recommendations": ["Drag and drop shapes from the toolbox to start modeling."]
        }

    # 1. Check for isolated nodes (Broken Flow)
    connected_nodes = set()
    for edge in edges:
        connected_nodes.add(edge.get("source"))
        connected_nodes.add(edge.get("target"))

    isolated_nodes = []
    for node in nodes:
        node_id = node.get("id")
        if node_id not in connected_nodes:
            isolated_nodes.append(node.get("data", {}).get("label") or node_id)

    if isolated_nodes:
        issues.append({
            "severity": "WARNING",
            "category": "Broken Flow",
            "message": f"Isolated nodes found: {', '.join(isolated_nodes)}. These elements are not connected to any other shape."
        })
        recommendations.append("Connect isolated nodes to show data or process relationships.")

    # 2. Check for duplicate labels
    labels = {}
    for node in nodes:
        label = node.get("data", {}).get("label", "").strip().lower()
        if label:
            labels[label] = labels.get(label, 0) + 1

    duplicates = [name for name, count in labels.items() if count > 1]
    if duplicates:
        issues.append({
            "severity": "WARNING",
            "category": "Consistency",
            "message": f"Duplicate shape names found: {', '.join(duplicates)}. Ensure distinct names to avoid ambiguity."
        })
        recommendations.append("Rename overlapping steps or nodes to make interactions unique.")

    # 3. Naming Violations (e.g. processes should start with a verb, etc.)
    short_names = []
    for node in nodes:
        label = node.get("data", {}).get("label", "")
        if len(label) < 3:
            short_names.append(label or node.get("id"))
    if short_names:
        issues.append({
            "severity": "INFO",
            "category": "Naming Standards",
            "message": f"Nodes with very short names (<3 chars): {', '.join(short_names)}. Consider descriptive labels."
        })
        recommendations.append("Review labels of short nodes to align with BABOK modeling guidelines.")

    # 4. BPMN specific validation
    bpmn_has_start = False
    bpmn_has_end = False
    is_bpmn_type = False
    
    for node in nodes:
        ntype = str(node.get("type", "")).upper()
        shape = str(node.get("data", {}).get("shape", "")).upper()
        if "EVENT" in ntype or "EVENT" in shape:
            label = str(node.get("data", {}).get("label", "")).lower()
            if "start" in label or "receive" in label:
                bpmn_has_start = True
            if "end" in label or "complete" in label or "finish" in label:
                bpmn_has_end = True
            is_bpmn_type = True
        elif "GATEWAY" in ntype or "GATEWAY" in shape:
            is_bpmn_type = True

    if is_bpmn_type:
        if not bpmn_has_start:
            issues.append({
                "severity": "ERROR",
                "category": "BPMN Compliance",
                "message": "BPMN processes must contain at least one Start Event node."
            })
            recommendations.append("Add a circular 'Start Event' shape to clearly map process entry points.")
        if not bpmn_has_end:
            issues.append({
                "severity": "WARNING",
                "category": "BPMN Compliance",
                "message": "No End Event node detected in the process flow."
            })
            recommendations.append("Add a thick circular 'End Event' shape to terminate workflow logic.")

    # 5. Cycle Detection (Circular Flow)
    adj = {node.get("id"): [] for node in nodes}
    for edge in edges:
        src = edge.get("source")
        dst = edge.get("target")
        if src in adj and dst in adj:
            adj[src].append(dst)

    visited = set()
    rec_stack = set()
    has_cycle = False

    def dfs(u):
        visited.add(u)
        rec_stack.add(u)
        for v in adj[u]:
            if v not in visited:
                if dfs(v):
                    return True
            elif v in rec_stack:
                return True
        rec_stack.remove(u)
        return False

    for node in nodes:
        nid = node.get("id")
        if nid not in visited:
            if dfs(nid):
                has_cycle = True
                break

    if has_cycle:
        issues.append({
            "severity": "WARNING",
            "category": "Circular Flow",
            "message": "Circular process loop detected. Confirm that this loop is not an infinite cycle."
        })
        recommendations.append("Validate back-loops to ensure there is a clear escape path or exit condition.")

    # 6. Requirement Coverage check
    unmapped_count = 0
    for node in nodes:
        mapped = node.get("data", {}).get("requirementId") or node.get("data", {}).get("requirement_id")
        # Ignore structural node shapes
        shape = str(node.get("data", {}).get("shape", "")).upper()
        if shape not in ["BOUNDARY", "SWIMLANE", "TEXT", "ANNOTATION"]:
            if not mapped:
                unmapped_count += 1

    if unmapped_count > 0:
        issues.append({
            "severity": "INFO",
            "category": "Traceability",
            "message": f"{unmapped_count} shapes are not linked to any requirement, stakeholder, or user story."
        })
        recommendations.append("Link core system components, actors, and processes to requirements to ensure 100% project coverage.")

    # Calculate Completeness Score
    # Metrics: Description present, Owner present, Mapped properties, styling customized
    node_scores = []
    for node in nodes:
        data = node.get("data", {})
        score = 0
        if data.get("label"): score += 30
        if data.get("description"): score += 30
        if data.get("owner"): score += 15
        if data.get("priority"): score += 15
        if data.get("requirementId") or data.get("requirement_id") or data.get("userStoryId"): score += 10
        node_scores.append(score)
    
    completeness_score = int(sum(node_scores) / len(node_scores)) if node_scores else 0

    # Calculate IEEE Compliance Score based on documentation content
    compliance_keywords = {
        "purpose": 20,
        "scope": 20,
        "actor": 15,
        "business rules": 15,
        "assumption": 15,
        "constraint": 15
    }
    
    doc_lower = str(documentation_text).lower()
    compliance_score = 0
    for kw, value in compliance_keywords.items():
        if kw in doc_lower:
            compliance_score += value

    # Limit to 100 max
    compliance_score = min(compliance_score, 100)
    if compliance_score < 50:
        issues.append({
            "severity": "WARNING",
            "category": "IEEE Compliance",
            "message": f"Low IEEE 1016 design compliance score ({compliance_score}%). Missing architectural sections."
        })
        recommendations.append("Generate or add Purpose, Scope, and Business Rules sections to the model documentation.")

    return {
        "completeness_score": completeness_score,
        "compliance_score": compliance_score,
        "issues": issues,
        "recommendations": recommendations
    }
