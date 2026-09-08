"""add stock to products

Revision ID: 5c08120d4a09
Revises: efd604105a82
Create Date: 2026-09-06 21:02:50.862933

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c08120d4a09"
down_revision: Union[str, Sequence[str], None] = "efd604105a82"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add stock column to products."""
    op.add_column(
        "products",
        sa.Column(
            "stock",
            sa.Integer(),
            nullable=False,
            server_default="20",
        ),
    )

    op.alter_column(
        "products",
        "stock",
        server_default=None,
    )


def downgrade() -> None:
    """Remove stock column from products."""
    op.drop_column("products", "stock")
