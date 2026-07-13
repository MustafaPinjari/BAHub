# Generated manually for database optimization
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('requirements', '0001_initial'),
        ('stakeholders', '0001_initial'),
        ('stories', '0001_initial'),
        ('risks', '0001_initial'),
        ('strategic', '0001_initial'),
    ]

    operations = [
        # Projects indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projects_org ON projects_project(organization_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects_project(status);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects_project(organization_id, status);"
        ),
        
        # Requirements indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements_requirement(project_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requirements_org ON requirements_requirement(project__organization_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements_requirement(status);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requirements_priority ON requirements_requirement(priority);"
        ),
        
        # Stakeholders indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stakeholders_org ON stakeholders_stakeholder(organization_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stakeholders_project ON stakeholders_stakeholder(project_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stakeholders_org_project ON stakeholders_stakeholder(organization_id, project_id);"
        ),
        
        # User Stories indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stories_requirement ON stories_userstory(requirement_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stories_project ON stories_userstory(requirement__project_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_stories_status ON stories_userstory(status);"
        ),
        
        # Risks indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_risks_project ON risks_risk(project_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_risks_org ON risks_risk(project__organization_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_risks_status ON risks_risk(status);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_risks_probability ON risks_risk(probability);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_risks_impact ON risks_risk(impact);"
        ),
        
        # Strategic analysis indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_swot_project ON strategic_swotanalysis(project_id);"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_gap_project ON strategic_gapanalysis(project_id);"
        ),
    ]
