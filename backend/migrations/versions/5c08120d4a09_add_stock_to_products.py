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
    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(
            sa.Column("stock", sa.Integer(), server_default="0", nullable=False)
        )

    # 3. Remove the server default from the column so it doesn't apply to future inserts automatically
    with op.batch_alter_table("products") as batch_op:
        batch_op.alter_column(
            "stock",
            server_default=None
        )


def downgrade() -> None:
    """Remove stock column from products."""
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_column("stock")
