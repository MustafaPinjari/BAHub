import uuid
from django.db import models

class BaseModelQuerySet(models.QuerySet):
    def delete(self):
        """Soft delete all records in the current queryset."""
        return self.update(is_deleted=True)

    def hard_delete(self):
        """Physically delete all records in the current queryset from the database."""
        return super().delete()

class BaseModelManager(models.Manager):
    def get_queryset(self):
        """By default, return only records that are not soft-deleted."""
        return BaseModelQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def all_with_deleted(self):
        """Return all records, including soft-deleted ones."""
        return BaseModelQuerySet(self.model, using=self._db)

class BaseModel(models.Model):
    """
    An abstract base class model that provides common fields:
    - UUID primary key
    - Automatic created_at/updated_at audit timestamps
    - Soft delete capability
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)


    objects = BaseModelManager()
    
    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        """Perform a soft delete by setting is_deleted to True."""
        self.is_deleted = True
        self.save(update_fields=['is_deleted', 'updated_at'])

    def hard_delete(self, *args, **kwargs):
        """Perform a physical delete from the database."""
        super().delete(*args, **kwargs)
