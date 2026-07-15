# SRS Module Documentation

## Overview

The SRS (Software Requirements Specification) module provides comprehensive functionality for creating, managing, and collaborating on IEEE 830 standard SRS documents. It includes AI-powered generation, version control, collaboration features, and multi-format export/import capabilities.

## Architecture

### Backend Components

#### Models

**SRSDocument**
- Main SRS document model following IEEE 830 structure
- Fields: title, description, project, status, template_type, version, word_count, reading_time_minutes, is_ai_generated
- Status choices: DRAFT, REVIEW, APPROVED, ARCHIVED
- Template choices: BLANK_IEEE, AI_GENERATED, IMPORTED_DOCX, IMPORTED_PDF, DUPLICATED

**SRSSection**
- Individual sections of an SRS document with hierarchical structure
- Supports collapsible sections and nested child sections
- Fields: document, parent_section, section_type, title, content, order, is_collapsed, is_locked
- 20+ predefined IEEE section types (INTRODUCTION, OVERALL_DESCRIPTION, EXTERNAL_INTERFACE, etc.)

**SRSVersion**
- Version history for SRS documents
- Stores snapshots for restore and compare functionality
- Fields: document, version_number, change_summary, created_by, snapshot_data (JSON)

**SRSComment**
- Comments and suggestions on SRS documents and sections
- Supports threaded replies and resolution workflow
- Fields: document, section, parent_comment, author, content, is_resolved, resolved_by, resolved_at

**SRSApproval**
- Approval workflow for SRS documents
- Tracks reviewer assignments and approval status
- Fields: document, reviewer, status, comments, reviewed_at
- Status choices: PENDING, APPROVED, REJECTED, CHANGES_REQUESTED

**SRSExport**
- Export history for SRS documents
- Tracks exports to different formats
- Fields: document, format, exported_by, file_path, file_size
- Format choices: PDF, DOCX, MARKDOWN, HTML, JSON

**SRSImport**
- Import history for SRS documents
- Tracks imports from external files
- Fields: document, format, imported_by, original_filename, file_path, import_status, error_message
- Format choices: DOCX, MARKDOWN, PDF, IEEE_SRS

**AIGenerationHistory**
- History of AI generation operations for SRS documents
- Tracks what was generated and from what source
- Fields: document, generation_type, source_type, source_id, prompt, generated_content, ai_credits_used, generated_by
- Generation types: FULL_SRS, FUNCTIONAL_REQUIREMENTS, NON_FUNCTIONAL_REQUIREMENTS, USE_CASES, etc.
- Source types: MEETING_NOTES, PROJECT_DESCRIPTION, BRD, FRD, USER_STORIES, etc.

#### Serializers

- **SRSDocumentSerializer**: Full document serializer with nested sections
- **SRSDocumentListSerializer**: Lightweight serializer for document lists
- **SRSSectionSerializer**: Section serializer with nested child sections
- **SRSVersionSerializer**: Version history serializer
- **SRSCommentSerializer**: Comment serializer with threaded replies
- **SRSApprovalSerializer**: Approval workflow serializer
- **SRSExportSerializer**: Export history serializer
- **SRSImportSerializer**: Import history serializer
- **AIGenerationHistorySerializer**: AI generation history serializer

#### ViewSets

**SRSDocumentViewSet**
- CRUD operations for SRS documents
- Custom actions: create_version, restore_version, request_approval, approve
- Tenant isolation enforced via organization filtering
- Plan limits enforced (FREE: 2 documents max)
- Real-time updates via WebSocket broadcasting
- Activity logging integration

**SRSSectionViewSet**
- CRUD operations for SRS sections
- Automatic word count and reading time calculation
- Hierarchical section support

**SRSCommentViewSet**
- CRUD operations for comments
- Custom action: resolve
- Threaded reply support

**SRSVersionViewSet**
- Read-only view for version history
- Tenant isolation enforced

**AIGenerationHistoryViewSet**
- Read-only view for AI generation history
- Tenant isolation enforced

#### URLs

```
/api/v1/srs/
├── documents/          # SRSDocumentViewSet
├── sections/           # SRSSectionViewSet
├── comments/           # SRSCommentViewSet
├── versions/           # SRSVersionViewSet
└── ai-history/         # AIGenerationHistoryViewSet
```

### Service Modules

#### AI Integration (`ai_integration.py`)
- **AIService**: Main service for AI-powered SRS content generation
- Methods:
  - `generate_srs_from_requirements()`: Generate full IEEE SRS from requirements
  - `generate_section()`: Generate specific SRS section
  - `enhance_section()`: Enhance existing section content
- Supports multiple source types (BRD, FRD, user stories, meeting notes)
- Placeholder for OpenAI API integration

#### Document Exporter (`document_exporter.py`)
- **DocumentExporter**: Service for exporting SRS documents to various formats
- Supported formats: PDF, DOCX, MARKDOWN, HTML, JSON
- Methods:
  - `export_to_pdf()`: Export to PDF format
  - `export_to_docx()`: Export to DOCX format
  - `export_to_markdown()`: Export to Markdown format
  - `export_to_html()`: Export to HTML format
  - `export_to_json()`: Export to JSON format
- Placeholder implementations for PDF/DOCX (requires reportlab/python-docx)

#### Document Importer (`document_importer.py`)
- Service for importing SRS documents from external files
- Supported formats: DOCX, MARKDOWN, PDF
- Parses imported content into SRS structure

#### Permissions (`permissions.py`)
- **IsSRSOwnerOrEditor**: Permission for document owners and editors
- **IsSRSOwnerOrReviewer**: Permission for owners and assigned reviewers
- **IsSRSViewer**: Permission for organization members (read-only)
- **SRSPermissionService**: Service for managing document permissions
  - `get_user_role()`: Get user's role (OWNER, EDITOR, REVIEWER, VIEWER)
  - `can_edit()`: Check edit permission
  - `can_review()`: Check review permission
  - `can_view()`: Check view permission
  - `can_delete()`: Check delete permission
  - `assign_reviewer()`: Assign reviewer to document
  - `remove_reviewer()`: Remove reviewer from document

#### Subscription Limits (`subscription_limits.py`)
- **SRSSubscriptionLimits**: Service for enforcing plan-based limits
- Plan configurations:
  - **FREE**: 2 documents, 5 AI generations, 50 sections, Markdown/JSON export only
  - **PRO**: 50 documents, 100 AI generations, 200 sections, all formats
  - **ENTERPRISE**: Unlimited everything
- Methods:
  - `get_user_plan()`: Get user's subscription plan
  - `can_create_document()`: Check document creation limit
  - `can_use_ai_generation()`: Check AI generation limit
  - `can_export_format()`: Check export format availability
  - `can_import_format()`: Check import format availability
  - `get_plan_features()`: Get all available features

#### Version Control (`version_control.py`)
- Service for managing SRS document versions
- Create, restore, and compare versions
- Snapshot storage in JSON format

#### Collaboration (`collaboration.py`)
- Service for real-time collaboration features
- WebSocket integration for live updates
- Comment threading and notifications

#### Search (`search.py`)
- Full-text search across SRS documents
- Search by title, description, and section content
- Filter by status, project, AI-generated flag

#### Linking (`linking.py`)
- Service for linking SRS documents to other entities
- Link to projects, requirements, use cases
- Bidirectional reference tracking

#### Sync Service (`sync_service.py`)
- Service for auto-syncing SRS with project data
- Sync with requirements, user stories, BRD/FRD
- Automatic content updates

### Frontend Components

#### SRSPage (`features/srs/SRSPage.tsx`)
- Main SRS dashboard page
- Document listing with filtering and search
- Create new SRS modal with template options
- Document status management

#### IEEETemplate (`features/srs/components/IEEETemplate.tsx`)
- IEEE 830 template structure with collapsible sections
- Hierarchical section navigation
- Section content display with formatting

#### SRSEditor (`features/srs/components/SRSEditor.tsx`)
- Rich document editor component
- Real-time content editing
- Section management (add, edit, delete, reorder)
- Auto-save functionality

## API Endpoints

### Documents

#### List Documents
```
GET /api/v1/srs/documents/
Query Params:
  - status: Filter by status (DRAFT, REVIEW, APPROVED, ARCHIVED)
  - project: Filter by project ID
  - ai_generated: Filter by AI-generated flag (true/false)
  - search: Search in title and description
```

#### Create Document
```
POST /api/v1/srs/documents/
Body:
{
  "title": "string",
  "description": "string",
  "project": "uuid",
  "template_type": "BLANK_IEEE" | "AI_GENERATED" | "IMPORTED_DOCX" | "IMPORTED_PDF" | "DUPLICATED"
}
```

#### Retrieve Document
```
GET /api/v1/srs/documents/{id}/
```

#### Update Document
```
PUT /api/v1/srs/documents/{id}/
PATCH /api/v1/srs/documents/{id}/
```

#### Delete Document
```
DELETE /api/v1/srs/documents/{id}/
```

#### Create Version
```
POST /api/v1/srs/documents/{id}/create_version/
Body:
{
  "version_number": "string",
  "change_summary": "string"
}
```

#### Restore Version
```
POST /api/v1/srs/documents/{id}/restore_version/
Body:
{
  "version_id": "uuid"
}
```

#### Request Approval
```
POST /api/v1/srs/documents/{id}/request_approval/
Body:
{
  "reviewer_ids": ["uuid", "uuid"]
}
```

#### Approve/Reject
```
POST /api/v1/srs/documents/{id}/approve/
Body:
{
  "status": "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
  "comments": "string"
}
```

### Sections

#### List Sections
```
GET /api/v1/srs/sections/
Query Params:
  - document: Filter by document ID
```

#### Create Section
```
POST /api/v1/srs/sections/
Body:
{
  "document": "uuid",
  "parent_section": "uuid" | null,
  "section_type": "string",
  "title": "string",
  "content": "string",
  "order": 0,
  "is_collapsed": false,
  "is_locked": false
}
```

#### Update Section
```
PUT /api/v1/srs/sections/{id}/
PATCH /api/v1/srs/sections/{id}/
```

#### Delete Section
```
DELETE /api/v1/srs/sections/{id}/
```

### Comments

#### List Comments
```
GET /api/v1/srs/comments/
Query Params:
  - document: Filter by document ID
  - section: Filter by section ID
```

#### Create Comment
```
POST /api/v1/srs/comments/
Body:
{
  "document": "uuid" | null,
  "section": "uuid" | null,
  "parent_comment": "uuid" | null,
  "content": "string"
}
```

#### Resolve Comment
```
POST /api/v1/srs/comments/{id}/resolve/
```

### Versions

#### List Versions
```
GET /api/v1/srs/versions/
Query Params:
  - document: Filter by document ID
```

### AI History

#### List AI History
```
GET /api/v1/srs/ai-history/
Query Params:
  - document: Filter by document ID
```

## Database Schema

### Tables

- `srs_documents`: Main SRS documents
- `srs_sections`: Document sections with hierarchy
- `srs_versions`: Version history snapshots
- `srs_comments`: Comments and replies
- `srs_approvals`: Approval workflow
- `srs_exports`: Export history
- `srs_imports`: Import history
- `ai_generation_history`: AI generation tracking

### Key Relationships

- SRSDocument → Project (ForeignKey)
- SRSDocument → User (created_by, last_modified_by)
- SRSSection → SRSDocument (ForeignKey)
- SRSSection → SRSSection (self-referential for hierarchy)
- SRSVersion → SRSDocument (ForeignKey)
- SRSComment → SRSDocument (ForeignKey, optional)
- SRSComment → SRSSection (ForeignKey, optional)
- SRSComment → SRSComment (self-referential for replies)
- SRSApproval → SRSDocument (ForeignKey)
- SRSExport → SRSDocument (ForeignKey)
- SRSImport → SRSDocument (ForeignKey)
- AIGenerationHistory → SRSDocument (ForeignKey, optional)

## Subscription Integration

### Plan Limits

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Max Documents | 2 | 50 | Unlimited |
| Max AI Generations | 5 | 100 | Unlimited |
| Max Sections per Document | 50 | 200 | Unlimited |
| Max Collaborators | 3 | 20 | Unlimited |
| Export Formats | Markdown, JSON | All formats | All formats |
| Import Formats | Markdown | DOCX, Markdown, PDF | DOCX, Markdown, PDF |
| AI Generation | ✓ | ✓ | ✓ |
| Version Control | ✓ | ✓ | ✓ |
| Collaboration | ✓ | ✓ | ✓ |

### Limit Enforcement

- Document creation checked in `SRSDocumentViewSet.perform_create()`
- AI generation checked via `SRSSubscriptionLimits.can_use_ai_generation()`
- Export format checked via `SRSSubscriptionLimits.can_export_format()`
- Import format checked via `SRSSubscriptionLimits.can_import_format()`

## Testing

### Test Coverage

Located in `backend/srs/tests.py`

- Model tests (CRUD operations, relationships)
- Serializer tests (validation, nested serialization)
- ViewSet tests (CRUD, custom actions, permissions)
- Service tests (AI integration, export/import, permissions)
- Subscription limits tests (plan enforcement)

### Running Tests

```bash
cd backend
python manage.py test srs
```

## Frontend Integration

### Navigation

SRS module integrated into DashboardShell sidebar with FileText icon.

### Routing

```typescript
// App.tsx
{
  path: "/srs",
  element: <SRSPage />
}
```

### Components

- **SRSPage**: Main dashboard with document listing
- **IEEETemplate**: IEEE template structure display
- **SRSEditor**: Rich text editor for content editing

## WebSocket Integration

### Real-time Updates

- Document changes broadcast to `project_{project_id}_srs` group
- Section updates trigger document word count recalculation
- Comment updates notify relevant users

### Channel Events

```python
{
  "type": "srs.update",
  "action": "create" | "update" | "delete",
  "document_id": "uuid",
  "user": "username"
}
```

## Security

### Tenant Isolation

- All queries filtered by organization_id
- Cross-organization access prevented
- Project-organization validation in serializers

### Permissions

- Role-based access control (Owner, Editor, Reviewer, Viewer)
- Document-level permissions enforced
- Section-level permissions inherited from document

### Data Validation

- Serializer-level validation
- Model constraints (choices, foreign keys)
- Business logic validation in ViewSets

## Future Enhancements

1. **Advanced AI Features**
   - Multi-model AI support (GPT-4, Claude, etc.)
   - Custom prompt templates
   - AI-powered requirement analysis

2. **Enhanced Collaboration**
   - Real-time collaborative editing (like Google Docs)
   - Video comments and annotations
   - Integration with external tools (Jira, Confluence)

3. **Advanced Export/Import**
   - Native PDF generation with styling
   - DOCX with proper formatting
   - PDF parsing for imports

4. **Analytics**
   - Document quality metrics
   - Requirement coverage analysis
   - Collaboration insights

5. **Templates**
   - Custom template creation
   - Template marketplace
   - Industry-specific templates

## Troubleshooting

### Common Issues

**Serializer NameError**
- Issue: Self-referential serializers causing NameError
- Solution: Use SerializerMethodField for nested relationships

**Payment Error**
- Issue: Field name mismatch between model and serializer
- Solution: Ensure field names match (e.g., gateway_customer_id vs stripe_customer_id)

**Permission Denied**
- Issue: User not in document's organization
- Solution: Verify organization membership and project assignment

**Limit Reached**
- Issue: Subscription plan limits exceeded
- Solution: Upgrade plan or reduce usage

## Dependencies

### Backend

- Django REST Framework
- Channels (WebSocket support)
- python-docx (DOCX export/import)
- reportlab (PDF export)
- weasyprint (HTML to PDF)

### Frontend

- React
- TypeScript
- Lucide React (icons)
- TailwindCSS (styling)

## Configuration

### Environment Variables

```bash
# AI Integration
OPENAI_API_KEY=your_openai_api_key
AI_API_URL=https://api.openai.com/v1/chat/completions

# Export/Import
MEDIA_ROOT=/path/to/media
EXPORT_DIR=/path/to/exports
```

### Django Settings

```python
INSTALLED_APPS = [
    ...
    'srs',
]

# WebSocket configuration
ASGI_APPLICATION = 'bahub_backend.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
```

## Migration Guide

### From Previous Version

1. Run migrations:
```bash
python manage.py migrate srs
```

2. Update serializers to use gateway_* fields instead of stripe_*

3. Update frontend to handle new permission structure

4. Test subscription limits enforcement

## Support

For issues or questions:
- Check this documentation
- Review test cases in `tests.py`
- Check Django logs for error details
- Verify subscription limits in billing module
