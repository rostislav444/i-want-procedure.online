"""Seed education topic categories

Revision ID: 051
Revises: 050
"""
from alembic import op
import sqlalchemy as sa

revision = "051"
down_revision = "050"


def upgrade() -> None:
    categories = sa.table(
        "education_topic_categories",
        sa.column("id", sa.Integer),
        sa.column("parent_id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("name_en", sa.String),
        sa.column("icon", sa.String),
        sa.column("order", sa.Integer),
        sa.column("is_active", sa.Boolean),
    )

    # Top-level categories
    op.bulk_insert(categories, [
        {"id": 1, "parent_id": None, "name": "Косметологія", "name_en": "Cosmetology", "icon": "✨", "order": 1, "is_active": True},
        {"id": 2, "parent_id": None, "name": "Ін'єкційна косметологія", "name_en": "Injectable Cosmetology", "icon": "💉", "order": 2, "is_active": True},
        {"id": 3, "parent_id": None, "name": "Апаратна косметологія", "name_en": "Hardware Cosmetology", "icon": "🔬", "order": 3, "is_active": True},
        {"id": 4, "parent_id": None, "name": "Перманентний макіяж", "name_en": "Permanent Makeup", "icon": "🎨", "order": 4, "is_active": True},
        {"id": 5, "parent_id": None, "name": "Масаж", "name_en": "Massage", "icon": "💆", "order": 5, "is_active": True},
        {"id": 6, "parent_id": None, "name": "Нігтьовий сервіс", "name_en": "Nail Service", "icon": "💅", "order": 6, "is_active": True},
        {"id": 7, "parent_id": None, "name": "Перукарське мистецтво", "name_en": "Hairdressing", "icon": "💇", "order": 7, "is_active": True},
        {"id": 8, "parent_id": None, "name": "Візаж", "name_en": "Makeup", "icon": "💄", "order": 8, "is_active": True},
        {"id": 9, "parent_id": None, "name": "Бізнес та маркетинг", "name_en": "Business & Marketing", "icon": "📊", "order": 9, "is_active": True},
        {"id": 10, "parent_id": None, "name": "Медична естетика", "name_en": "Medical Aesthetics", "icon": "🏥", "order": 10, "is_active": True},
        # Subcategories
        {"id": 11, "parent_id": 2, "name": "Ботулотоксин", "name_en": "Botulinum Toxin", "icon": None, "order": 1, "is_active": True},
        {"id": 12, "parent_id": 2, "name": "Контурна пластика", "name_en": "Dermal Fillers", "icon": None, "order": 2, "is_active": True},
        {"id": 13, "parent_id": 2, "name": "Мезотерапія", "name_en": "Mesotherapy", "icon": None, "order": 3, "is_active": True},
        {"id": 14, "parent_id": 2, "name": "Біоревіталізація", "name_en": "Biorevitalization", "icon": None, "order": 4, "is_active": True},
        {"id": 15, "parent_id": 2, "name": "Ліполітики", "name_en": "Lipolytics", "icon": None, "order": 5, "is_active": True},
        {"id": 16, "parent_id": 4, "name": "Мікроблейдинг", "name_en": "Microblading", "icon": None, "order": 1, "is_active": True},
        {"id": 17, "parent_id": 4, "name": "Татуаж брів", "name_en": "Eyebrow Tattoo", "icon": None, "order": 2, "is_active": True},
        {"id": 18, "parent_id": 4, "name": "Татуаж губ", "name_en": "Lip Tattoo", "icon": None, "order": 3, "is_active": True},
        {"id": 19, "parent_id": 1, "name": "Пілінги", "name_en": "Peels", "icon": None, "order": 1, "is_active": True},
        {"id": 20, "parent_id": 1, "name": "Чистки обличчя", "name_en": "Facial Cleansing", "icon": None, "order": 2, "is_active": True},
    ])


def downgrade() -> None:
    op.execute("DELETE FROM education_topic_categories")
