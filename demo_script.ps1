# BAHub Comprehensive Demo Script
# This script demonstrates all key features of the BAHub business analysis platform

param(
    [string]$BaseUrl = "http://127.0.0.1:8000/api/v1",
    [string]$FrontendUrl = "http://localhost:5173",
    [switch]$SkipSetup = $false
)

# Color output functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($Message) {
    Write-ColorOutput Cyan "`n=== $Message ==="
}

function Write-SubStep($Message) {
    Write-ColorOutput Yellow "  → $Message"
}

function Write-Success($Message) {
    Write-ColorOutput Green "  ✓ $Message"
}

function Write-Error($Message) {
    Write-ColorOutput Red "  ✗ $Message"
}

function Write-Info($Message) {
    Write-ColorOutput Gray "  ℹ $Message"
}

# API helper functions
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Data = $null,
        [string]$Token = $null
    )
    
    $headers = @{"Content-Type" = "application/json"}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $body = $null
    if ($Data) {
        $body = $Data | ConvertTo-Json -Depth 10
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -Body $body -ErrorAction Stop
        return $response
    }
    catch {
        Write-Error "API call failed: $($_.Exception.Message)"
        return $null
    }
}

# Demo configuration
$DemoUser = @{
    email = "demo@bahub.com"
    password = "DemoPassword123!"
    first_name = "Demo"
    last_name = "User"
    role = "BUSINESS_ANALYST"
}

$DemoProject = @{
    name = "E-Commerce Platform Redesign"
    description = "Complete redesign of the existing e-commerce platform with modern UX and improved performance"
    status = "ACTIVE"
}

$DemoStakeholders = @(
    @{
        name = "Sarah Johnson"
        title = "Product Manager"
        department = "Product"
        email = "sarah.johnson@company.com"
        power = "HIGH"
        interest = "HIGH"
        influence = 5
        impact = 5
    },
    @{
        name = "Michael Chen"
        title = "CTO"
        department = "Engineering"
        email = "michael.chen@company.com"
        power = "HIGH"
        interest = "HIGH"
        influence = 5
        impact = 5
    },
    @{
        name = "Emily Davis"
        title = "UX Designer"
        department = "Design"
        email = "emily.davis@company.com"
        power = "MEDIUM"
        interest = "HIGH"
        influence = 4
        impact = 4
    }
)

$DemoRequirements = @(
    @{
        title = "User Authentication with OAuth 2.0"
        description = "Implement OAuth 2.0 authentication allowing users to sign in with Google, Facebook, and Apple accounts"
        req_type = "FUNCTIONAL"
        priority = "HIGH"
        status = "DRAFT"
    },
    @{
        title = "Page Load Time < 2 Seconds"
        description = "Optimize application performance to ensure all pages load within 2 seconds on 4G networks"
        req_type = "NON_FUNCTIONAL"
        priority = "HIGH"
        status = "DRAFT"
    },
    @{
        title = "Mobile-First Responsive Design"
        description = "Ensure all UI components are fully responsive and optimized for mobile devices"
        req_type = "UI"
        priority = "MEDIUM"
        status = "DRAFT"
    }
)

# Main demo execution
function Start-Demo {
    Write-ColorOutput Magenta "
    ╔════════════════════════════════════════════════════════════╗
    ║           BAHub Business Analysis Platform Demo               ║
    ║                    Comprehensive Feature Tour                  ║
    ╚════════════════════════════════════════════════════════════╝
    "
    
    Write-Info "Backend API: $BaseUrl"
    Write-Info "Frontend: $FrontendUrl"
    Write-Info "Demo User: $($DemoUser.email)"
    
    # Check if servers are running
    Write-Step "Checking Server Status"
    try {
        $healthCheck = Invoke-RestMethod -Uri "$BaseUrl/public/settings/" -Method Get -ErrorAction Stop
        Write-Success "Backend server is running"
    }
    catch {
        Write-Error "Backend server is not accessible. Please start the backend server first."
        Write-Info "Run: cd backend && python manage.py runserver"
        return
    }
    
    # Authentication Demo
    Write-Step "Authentication & User Management"
    Write-SubStep "Registering demo user..."
    $registerResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/register/" -Data $DemoUser
    if ($registerResponse) {
        Write-Success "User registered successfully"
    }
    else {
        Write-Info "User may already exist, proceeding with login..."
    }
    
    Write-SubStep "Logging in..."
    $loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login/" -Data @{
        email = $DemoUser.email
        password = $DemoUser.password
    }
    
    if ($loginResponse -and $loginResponse.access) {
        $token = $loginResponse.access
        Write-Success "Login successful"
        Write-Info "Access token obtained"
    }
    else {
        Write-Error "Login failed"
        return
    }
    
    Write-SubStep "Fetching user profile..."
    $profile = Invoke-ApiCall -Method "GET" -Endpoint "/auth/profile/" -Token $token
    if ($profile) {
        Write-Success "Profile retrieved: $($profile.first_name) $($profile.last_name) - $($profile.role)"
    }
    
    # Organization Demo
    Write-Step "Organization Management"
    Write-SubStep "Fetching organization details..."
    $org = Invoke-ApiCall -Method "GET" -Endpoint "/organizations/" -Token $token
    if ($org) {
        Write-Success "Organization: $($org.name)"
        Write-Info "Plan: $($org.plan_tier)"
    }
    
    # Project Management Demo
    Write-Step "Project Management"
    Write-SubStep "Creating demo project..."
    $projectResponse = Invoke-ApiCall -Method "POST" -Endpoint "/projects/" -Data $DemoProject -Token $token
    if ($projectResponse -and $projectResponse.id) {
        $projectId = $projectResponse.id
        Write-Success "Project created: $($DemoProject.name)"
        Write-Info "Project ID: $projectId"
    }
    else {
        Write-SubStep "Fetching existing project..."
        $projects = Invoke-ApiCall -Method "GET" -Endpoint "/projects/" -Token $token
        if ($projects -and $projects.Count -gt 0) {
            $projectId = $projects[0].id
            Write-Success "Using existing project: $($projects[0].name)"
        }
        else {
            Write-Error "No projects available"
            return
        }
    }
    
    Write-SubStep "Fetching project details..."
    $projectDetails = Invoke-ApiCall -Method "GET" -Endpoint "/projects/$projectId/" -Token $token
    if ($projectDetails) {
        Write-Success "Project status: $($projectDetails.status)"
        Write-Info "Created: $($projectDetails.created_at)"
    }
    
    # Stakeholder Management Demo
    Write-Step "Stakeholder Management"
    foreach ($stakeholder in $DemoStakeholders) {
        Write-SubStep "Adding stakeholder: $($stakeholder.name)"
        $stakeholderData = $stakeholder.Clone()
        $stakeholderData['project'] = $projectId
        
        $stakeholderResponse = Invoke-ApiCall -Method "POST" -Endpoint "/stakeholders/" -Data $stakeholderData -Token $token
        if ($stakeholderResponse) {
            Write-Success "Stakeholder added: $($stakeholder.name)"
        }
    }
    
    Write-SubStep "Fetching all stakeholders..."
    $stakeholders = Invoke-ApiCall -Method "GET" -Endpoint "/stakeholders/?project=$projectId" -Token $token
    if ($stakeholders) {
        Write-Success "Total stakeholders: $($stakeholders.Count)"
        foreach ($s in $stakeholders) {
            Write-Info "  - $($s.name) ($($s.title)) - Power: $($s.power), Interest: $($s.interest)"
        }
    }
    
    # Requirements Management Demo
    Write-Step "Requirements Management"
    foreach ($req in $DemoRequirements) {
        Write-SubStep "Creating requirement: $($req.title)"
        $reqData = $req.Clone()
        $reqData['project'] = $projectId
        
        $reqResponse = Invoke-ApiCall -Method "POST" -Endpoint "/requirements/" -Data $reqData -Token $token
        if ($reqResponse) {
            Write-Success "Requirement created: $($req.title) (ID: $($reqResponse.req_id))"
        }
    }
    
    Write-SubStep "Fetching all requirements..."
    $requirements = Invoke-ApiCall -Method "GET" -Endpoint "/requirements/?project=$projectId" -Token $token
    if ($requirements) {
        Write-Success "Total requirements: $($requirements.Count)"
        foreach ($r in $requirements) {
            Write-Info "  - [$($r.req_id)] $($r.title) - Priority: $($r.priority), Status: $($r.status)"
        }
    }
    
    # User Stories Demo
    Write-Step "User Stories Management"
    Write-SubStep "Creating user story from requirement..."
    if ($requirements -and $requirements.Count -gt 0) {
        $storyData = @{
            title = "As a user, I want to sign in with Google"
            description = "So that I can quickly access my account without remembering another password"
            acceptance_criteria = "User can click 'Sign in with Google' button, User is redirected to Google OAuth, User is logged in upon successful authentication"
            priority = "HIGH"
            story_points = 5
            project = $projectId
            requirement = $requirements[0].id
        }
        
        $storyResponse = Invoke-ApiCall -Method "POST" -Endpoint "/stories/" -Data $storyData -Token $token
        if ($storyResponse) {
            Write-Success "User story created: $($storyData.title)"
        }
    }
    
    # Strategic Analysis Demo
    Write-Step "Strategic Analysis"
    Write-SubStep "Creating SWOT Analysis..."
    $swotData = @{
        name = "E-Commerce Platform SWOT"
        project = $projectId
        strengths = "Strong brand recognition, Loyal customer base, Established supply chain"
        weaknesses = "Outdated technology stack, Slow page load times, Limited mobile optimization"
        opportunities = "Growing e-commerce market, Mobile-first trend, AI personalization"
        threats = "Strong competition, Economic downturn, Changing consumer behavior"
    }
    
    $swotResponse = Invoke-ApiCall -Method "POST" -Endpoint "/strategic/swot/" -Data $swotData -Token $token
    if ($swotResponse) {
        Write-Success "SWOT analysis created"
    }
    
    Write-SubStep "Creating Gap Analysis..."
    $gapData = @{
        name = "Current vs Future State Analysis"
        project = $projectId
        current_state = "Legacy monolithic architecture, manual deployment process, limited monitoring"
        future_state = "Microservices architecture, CI/CD pipeline, comprehensive observability"
        gaps = "Infrastructure modernization, Team training, Process automation"
    }
    
    $gapResponse = Invoke-ApiCall -Method "POST" -Endpoint "/strategic/gap/" -Data $gapData -Token $token
    if ($gapResponse) {
        Write-Success "Gap analysis created"
    }
    
    # Risk Management Demo
    Write-Step "Risk Management"
    Write-SubStep "Creating risk assessment..."
    $riskData = @{
        title = "Security Vulnerability in Legacy Code"
        description = "Potential security vulnerabilities in outdated dependencies could expose user data"
        risk_category = "SECURITY"
        probability = "MEDIUM"
        impact = "HIGH"
        mitigation_strategy = "Update all dependencies, implement security scanning, conduct penetration testing"
        project = $projectId
    }
    
    $riskResponse = Invoke-ApiCall -Method "POST" -Endpoint "/risks/" -Data $riskData -Token $token
    if ($riskResponse) {
        Write-Success "Risk assessment created"
    }
    
    # Documents Demo
    Write-Step "Document Management"
    Write-SubStep "Creating BRD document..."
    $brdData = @{
        title = "E-Commerce Platform Redesign BRD"
        doc_type = "BRD"
        content = @{
            executive_summary = "This document outlines the business requirements for the e-commerce platform redesign project"
            scope = "Complete UI/UX redesign, performance optimization, mobile responsiveness"
            assumptions = "Budget approved, Team available, Timeline 6 months"
        } | ConvertTo-Json -Depth 10
        project = $projectId
    }
    
    $brdResponse = Invoke-ApiCall -Method "POST" -Endpoint "/documents/" -Data $brdData -Token $token
    if ($brdResponse) {
        Write-Success "BRD document created"
    }
    
    # AI Features Demo
    Write-Step "AI-Powered Features"
    Write-SubStep "Triggering AI analysis..."
    if ($requirements -and $requirements.Count -gt 0) {
        $aiData = @{
            project_id = $projectId
            message = "Analyze the requirements and suggest improvements"
            action_type = "ANALYZE"
        }
        
        $aiResponse = Invoke-ApiCall -Method "POST" -Endpoint "/strategic/ai/chat/" -Data $aiData -Token $token
        if ($aiResponse) {
            Write-Success "AI analysis initiated (Job ID: $($aiResponse.job_id))"
            Write-Info "Note: AI responses are processed asynchronously"
        }
    }
    
    # Billing Demo
    Write-Step "Billing & Subscription"
    Write-SubStep "Fetching subscription details..."
    $subscription = Invoke-ApiCall -Method "GET" -Endpoint "/billing/subscription/" -Token $token
    if ($subscription) {
        Write-Success "Current plan: $($subscription.plan_tier)"
        Write-Info "Status: $($subscription.status)"
        if ($subscription.next_billing_date) {
            Write-Info "Next billing: $($subscription.next_billing_date)"
        }
    }
    
    Write-SubStep "Fetching invoices..."
    $invoices = Invoke-ApiCall -Method "GET" -Endpoint "/billing/invoices/" -Token $token
    if ($invoices) {
        Write-Success "Total invoices: $($invoices.Count)"
    }
    
    # Team Management Demo
    Write-Step "Team Management"
    Write-SubStep "Fetching team members..."
    $team = Invoke-ApiCall -Method "GET" -Endpoint "/teams/" -Token $token
    if ($team) {
        Write-Success "Team members: $($team.Count)"
        foreach ($member in $team) {
            Write-Info "  - $($member.first_name) $($member.last_name) - $($member.role)"
        }
    }
    
    # Project Report Demo
    Write-Step "Project Reporting"
    Write-SubStep "Generating project report..."
    $report = Invoke-ApiCall -Method "GET" -Endpoint "/projects/$projectId/report/" -Token $token
    if ($report) {
        Write-Success "Project report generated"
        Write-Info "Total requirements: $($report.total_requirements)"
        Write-Info "Completed requirements: $($report.completed_requirements)"
        Write-Info "Total stakeholders: $($report.total_stakeholders)"
        Write-Info "Total risks: $($report.total_risks)"
    }
    
    # Growth Features Demo
    Write-Step "Growth Features"
    Write-SubStep "Referral Program..."
    $referralCode = Invoke-ApiCall -Method "POST" -Endpoint "/referrals/codes/generate/" -Token $token
    if ($referralCode) {
        Write-Success "Referral code generated: $($referralCode.code)"
        Write-Info "Credits per referral: $($referralCode.credits_per_referral)"
    }
    
    Write-SubStep "Template Gallery..."
    $templates = Invoke-ApiCall -Method "GET" -Endpoint "/templates/public/" -Token $token
    if ($templates) {
        Write-Success "Public templates available: $($templates.results.Count)"
    }
    
    # Demo Summary
    Write-Step "Demo Summary"
    Write-ColorOutput Magenta "
    ╔════════════════════════════════════════════════════════════╗
    ║                  Demo Completed Successfully!                   ║
    ╚════════════════════════════════════════════════════════════╝
    "
    
    Write-Success "Features Demonstrated:"
    Write-Info "  ✓ Authentication & User Management"
    Write-Info "  ✓ Organization Management"
    Write-Info "  ✓ Project Management"
    Write-Info "  ✓ Stakeholder Management"
    Write-Info "  ✓ Requirements Management"
    Write-Info "  ✓ User Stories Management"
    Write-Info "  ✓ Strategic Analysis (SWOT, Gap Analysis)"
    Write-Info "  ✓ Risk Management"
    Write-Info "  ✓ Document Management"
    Write-Info "  ✓ AI-Powered Features"
    Write-Info "  ✓ Billing & Subscription"
    Write-Info "  ✓ Team Management"
    Write-Info "  ✓ Project Reporting"
    Write-Info "  ✓ Growth Features (Referrals, Templates)"
    
    Write-ColorOutput Cyan "`nNext Steps:"
    Write-Info "  1. Open $FrontendUrl to explore the UI"
    Write-Info "  2. Login with: $($DemoUser.email) / $($DemoUser.password)"
    Write-Info "  3. Navigate through the dashboard to see created data"
    Write-Info "  4. Try additional features like diagrams, meetings, and integrations"
    
    Write-ColorOutput Yellow "`nDemo Data Summary:"
    Write-Info "  Project: $($DemoProject.name)"
    Write-Info "  Stakeholders: $($DemoStakeholders.Count)"
    Write-Info "  Requirements: $($DemoRequirements.Count)"
    Write-Info "  User: $($DemoUser.email)"
}

# Run the demo
Start-Demo
