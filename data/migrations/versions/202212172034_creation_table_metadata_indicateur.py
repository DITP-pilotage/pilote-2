"""Creation table metadata_indicateur

Revision ID: ff331d893a0b
Revises: bf139c16bc0d
Create Date: 2022-12-17 20:34:59.762410

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ff331d893a0b'
down_revision = 'bf139c16bc0d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('metadata_indicateur',
                    sa.Column('indic_id', sa.VARCHAR(length=7), nullable=False),
                    sa.Column('indic_parent_indic', sa.VARCHAR(length=7), nullable=True),
                    sa.Column('indic_parent_ch', sa.VARCHAR(length=7), nullable=False),
                    sa.Column('indic_nom', sa.VARCHAR(length=255), nullable=False),
                    sa.Column('indic_descr', sa.TEXT(), nullable=True),
                    sa.Column('indic_is_perseverant', sa.BOOLEAN(), nullable=True),
                    sa.Column('indic_is_phare', sa.BOOLEAN(), nullable=True),
                    sa.Column('indic_is_baro', sa.BOOLEAN(), nullable=True),
                    sa.Column('indic_type', sa.VARCHAR(length=31), nullable=True),
                    sa.PrimaryKeyConstraint('indic_id'),
                    schema='raw_data'
                    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('metadata_indicateur', schema='raw_data')
    # ### end Alembic commands ###
