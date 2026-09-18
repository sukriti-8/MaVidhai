"""Add is_active to User

Revision ID: 1e20ba6a0a8d
Revises: 06b0f0e02c0a
Create Date: 2026-09-17 13:11:00.546102

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e20ba6a0a8d'
down_revision: Union[str, Sequence[str], None] = '06b0f0e02c0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('is_active')
