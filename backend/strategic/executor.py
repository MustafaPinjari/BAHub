import os
import json
import urllib.request
import urllib.error
import logging
from concurrent.futures import ThreadPoolExecutor
from django.db import close_old_connections
from strategic.models import AIJob

logger = logging.getLogger(__name__)

# ThreadPoolExecutor to handle background LLM calls
ai_executor = ThreadPoolExecutor(max_workers=4)


def call_llm(prompt, system_instruction=""):
    import time
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    if gemini_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        full_text = f"{system_instruction}\n\nUser request: {prompt}"
        data = {
            "contents": [{
                "parts": [{
                    "text": full_text
                }]
            }]
        }
        
        retries = 3
        timeout = 45
        for attempt in range(retries):
            req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    return res_body["candidates"][0]["content"]["parts"][0]["text"]
            except urllib.error.HTTPError as e:
                logger.warning(f"Gemini API HTTP {e.code} on attempt {attempt + 1}: {e.reason}")
                if e.code in [429, 503] and attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise Exception(f"Gemini API failure (HTTP {e.code}): {e.reason}")
            except Exception as e:
                logger.warning(f"Gemini API exception on attempt {attempt + 1}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise Exception(f"Gemini API failure: {e}")
            
    elif openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                return res_body["choices"][0]["message"]["content"]
        except urllib.error.URLError as e:
            raise Exception(f"OpenAI API failure: {e}")
            
    return None

def run_ai_job_task(job_id):
    """
    Runs the LLM invocation in a separate thread, safely managing database connections
    and updating the status/result of the AIJob.
    If no API keys are configured, falls back to the defined mock templates.
    """
    try:
        close_old_connections()
        try:
            job = AIJob.objects.get(id=job_id)
        except AIJob.DoesNotExist:
            logger.error(f"AIJob {job_id} not found in background task.")
            return

        # Verify subscription is active and verified
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=job.project.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        if sub.plan_tier != "FREE" and not sub.plan_verified:
            raise Exception("Your subscription is pending verification. Please verify it via the email sent to your administrator.")
        if not sub.is_active:
            raise Exception("Your workspace subscription is inactive. Please update billing.")

        # Update status to PROCESSING
        job.status = "PROCESSING"
        job.save()

        # Compile workspace context strings from database
        project = job.project
        reqs = project.requirements.all()
        stakeholders = project.stakeholders.all()
        risks = project.risks.all()
        
        from stories.models import UserStory
        stories = UserStory.objects.filter(requirement__project=project)
        
        context_str = f"Project Context:\n"
        context_str += f"- Name: {project.name}\n"
        context_str += f"- Description: {project.description or 'None'}\n"
        
        context_str += "\nStakeholders:\n"
        if not stakeholders.exists():
            context_str += "  None\n"
        else:
            for s in stakeholders:
                context_str += f"  * {s.name} ({s.title})\n"
                
        context_str += "\nRequirements:\n"
        if not reqs.exists():
            context_str += "  None\n"
        else:
            for r in reqs:
                context_str += f"  * {r.req_id}: {r.title} [Type: {r.req_type}, Priority: {r.priority}, Status: {r.status}]\n"
                if r.description:
                    context_str += f"    Description: {r.description}\n"
                    
        context_str += "\nRisks:\n"
        if not risks.exists():
            context_str += "  None\n"
        else:
            for r in risks:
                context_str += f"  * {r.name}: {r.description} [Severity: {r.severity}, Probability: {r.probability}]\n"
                if r.mitigation:
                    context_str += f"    Mitigation: {r.mitigation}\n"
                    
        context_str += "\nUser Stories:\n"
        if not stories.exists():
            context_str += "  None\n"
        else:
            for s in stories:
                context_str += f"  * {s.story_id}: {s.title} [Points: {s.points}, Status: {s.status}]\n"

        # Build custom system instruction based on job type and database context
        system_instruction = (
            "You are an expert AI Business Analyst Assistant integrated with the BAHub workspace.\n"
            "You are helping a team analyze, trace, and audit project requirements, user stories, threats, and test scripts.\n"
            "Return responses using clean, structured GitHub-flavored Markdown headers, paragraphs, and tables.\n\n"
            f"Here is the database context of the current active project:\n"
            "----------------------------------------\n"
            f"{context_str}\n"
            "----------------------------------------\n"
            "Answer the user's requests based on this context. Keep the focus professional, technical, and accurate."
        )

        # Execute call
        reply = call_llm(job.prompt, system_instruction=system_instruction)

        # Fallback to templates if no API key is specified or returns None
        if reply is None:
            prompt_lower = job.prompt.lower()
            req_count = reqs.count()
            story_count = stories.count()
            risk_count = risks.count()
            stakeholder_count = stakeholders.count()
            action_type = job.job_type

            if action_type == "GENERATE_STORIES" or "user story" in prompt_lower or "stories" in prompt_lower:
                reply = (
                    f"### 🤖 Generated Agile User Stories\n"
                    f"Based on the **{project.name}** context (Total Requirements: {req_count}):\n\n"
                    f"1. **US-010: Dashboard Analytics View**\n"
                    f"   - **As a** Business Analyst\n"
                    f"   - **I want to** view aggregated status charts of requirements and active user story points\n"
                    f"   - **So that** I can track pipeline velocity instantly.\n"
                    f"   - *Acceptance Criteria*: \n"
                    f"     - Renders responsive bars representing Approved vs. Draft tickets.\n"
                    f"     - Refreshes automatically when projects switch.\n\n"
                    f"2. **US-011: Automated Stakeholder Notices**\n"
                    f"   - **As a** Product Owner\n"
                    f"   - **I want to** receive email triggers when stakeholder sign-offs are submitted\n"
                    f"   - **So that** deployment schedules can align with strategic objectives.\n"
                )
            elif action_type == "ANALYZE_RISKS" or "risk" in prompt_lower or "mitigation" in prompt_lower:
                reply = (
                    f"### 🤖 Projected Threat Vectors & Mitigations\n"
                    f"Audit summary for **{project.name}** (Active Risks: {risk_count}):\n\n"
                    f"| Threat Vector | Severity | Mitigation Strategy |\n"
                    f"| :--- | :---: | :--- |\n"
                    f"| API Integration Latency | **High** | Establish fallbacks to cache query profiles. |\n"
                    f"| Multi-Tenant Leakage | **High** | Enforce tenant scoping validations on all model objects. |\n"
                    f"| Scope Creep on Sprint | **Medium** | Route all modifications through PO Change Request pipelines. |\n"
                )
            elif action_type == "DRAFT_TEST_CASES" or "test case" in prompt_lower or "qa" in prompt_lower or "test" in prompt_lower:
                reply = (
                    f"### 🤖 Generated QA Validation Scripts\n"
                    f"Drafted test scenarios for **{project.name}** specifications:\n\n"
                    f"#### **Scenario 1: Project Swapping Scoping Validation**\n"
                    f"- **Given** the user selects a project context in localStorage.\n"
                    f"- **When** they navigate to Stakeholders or Risks log dashboard.\n"
                    f"- **Then** the page must load data filtered strictly to the selected project ID.\n\n"
                    f"#### **Scenario 2: Action Item Status Switch**\n"
                    f"- **Given** an action item has status 'OPEN'.\n"
                    f"- **When** the manager toggles the checkbox.\n"
                    f"- **Then** the record status changes to 'COMPLETED' and is persisted to backend."
                )
            else:
                reply = (
                    f"Hello! I am your **AI Business Analyst Assistant**.\n\n"
                    f"I am fully integrated with your workspace **{project.name}**:\n"
                    f"- 📋 **{req_count}** Requirements registered.\n"
                    f"- 📝 **{story_count}** Agile User Stories mapped.\n"
                    f"- 👤 **{stakeholder_count}** Stakeholders cataloged.\n"
                    f"- ⚠️ **{risk_count}** Risks in database.\n\n"
                    f"How can I help you compile BRD documents, audit requirements for ambiguities, or generate test cases today?"
                )

        # Mark job as successful
        job.status = "SUCCESS"
        job.result = reply
        job.save()

        try:
            # Atomic increment prevents race conditions when multiple AI jobs
            # finish concurrently and both read/write ai_credits_used.
            # Uses F() expression so the DB does the increment, not Python.
            from django.db.models import F
            TenantSubscription.objects.filter(pk=sub.pk).update(
                ai_credits_used=F("ai_credits_used") + 1
            )
        except Exception as sub_err:
            logger.error(f"Failed to update subscription AI credit count: {sub_err}")


    except Exception as e:
        logger.exception(f"Error executing AIJob {job_id} in background: {e}")
        try:
            job = AIJob.objects.get(id=job_id)
            job.status = "FAILED"
            job.error_message = str(e)
            job.save()
        except Exception as inner_ex:
            logger.error(f"Could not save FAILED state for AIJob {job_id}: {inner_ex}")

    finally:
        close_old_connections()



def submit_ai_job(job_id):
    """
    Submit a job to the thread pool for asynchronous execution.
    During unit tests, we skip background threading to avoid SQLite locks,
    allowing the test runner to execute the task synchronously.
    """
    from django.conf import settings as _settings
    # Use settings.IS_TESTING which is set at startup by settings.py
    # (consistent with the project convention; avoids stale module-level snapshots).
    if getattr(_settings, "IS_TESTING", False):
        return
    ai_executor.submit(run_ai_job_task, job_id)

