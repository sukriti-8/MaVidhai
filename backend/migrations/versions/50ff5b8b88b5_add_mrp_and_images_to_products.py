"""add mrp and images to products

Revision ID: 50ff5b8b88b5
Revises: 58cc6b6cb945
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50ff5b8b88b5'
down_revision: Union[str, Sequence[str], None] = '58cc6b6cb945'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('products') as batch_op:
        batch_op.add_column(sa.Column('mrp', sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column('images', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('products') as batch_op:
        batch_op.drop_column('images')
        batch_op.drop_column('mrp')