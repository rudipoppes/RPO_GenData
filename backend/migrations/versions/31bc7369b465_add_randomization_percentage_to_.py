"""add_randomization_percentage_to_increment_fields

Revision ID: 31bc7369b465
Revises: 4110d6b038ab
Create Date: 2025-10-30 21:04:53.699741

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31bc7369b465'
down_revision: Union[str, None] = '4110d6b038ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add randomization_percentage column to fields table
    op.add_column('fields', sa.Column('randomization_percentage', sa.Float(), nullable=True, server_default='0.0'))
    
    # Add randomization_percentage column to spike_schedule_fields table
    op.add_column('spike_schedule_fields', sa.Column('randomization_percentage', sa.Float(), nullable=True, server_default='0.0'))


def downgrade() -> None:
    # Remove randomization_percentage column from spike_schedule_fields table
    op.drop_column('spike_schedule_fields', 'randomization_percentage')
    
    # Remove randomization_percentage column from fields table
    op.drop_column('fields', 'randomization_percentage')
