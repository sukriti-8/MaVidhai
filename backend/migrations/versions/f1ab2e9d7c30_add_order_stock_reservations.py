"""Add temporary order stock reservations.

Revision ID: f1ab2e9d7c30
Revises: a14c7e92d630
"""

from alembic import op
import sqlalchemy as sa


revision = "f1ab2e9d7c30"
down_revision = "a14c7e92d630"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("stock_reserved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "orders",
        sa.Column("stock_reserved_until", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "stock_reserved_until")
    op.drop_column("orders", "stock_reserved")
