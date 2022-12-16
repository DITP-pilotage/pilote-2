"""Initialisation du schema raw_data

Revision ID: bf139c16bc0d
Revises: 
Create Date: 2022-12-16 11:12:17.484011

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'bf139c16bc0d'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('_prisma_migrations', schema='raw_data')
    op.alter_column('metadata_chantier', 'chantier_id',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=7),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_code',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_descr',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_nom',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_ppg',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=7),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_perseverant',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=7),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_shorts_noDAC',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_ids_noDAC',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_shorts_DAC',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_ids_DAC',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_per',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'perimetre_id',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=7),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'per_nom',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'per_short',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'per_picto',
                    existing_type=sa.TEXT(),
                    type_=sa.VARCHAR(length=255),
                    existing_nullable=True,
                    schema='raw_data')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('metadata_perimetre', 'per_picto',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'per_short',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'per_nom',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_perimetre', 'perimetre_id',
                    existing_type=sa.VARCHAR(length=7),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_per',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_ids_DAC',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_shorts_DAC',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_ids_noDAC',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'porteur_shorts_noDAC',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_perseverant',
                    existing_type=sa.VARCHAR(length=7),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_ppg',
                    existing_type=sa.VARCHAR(length=7),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_nom',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_descr',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'ch_code',
                    existing_type=sa.VARCHAR(length=255),
                    type_=sa.TEXT(),
                    existing_nullable=True,
                    schema='raw_data')
    op.alter_column('metadata_chantier', 'chantier_id',
                    existing_type=sa.VARCHAR(length=7),
                    type_=sa.TEXT(),
                    existing_nullable=False,
                    schema='raw_data')
    op.create_table('_prisma_migrations',
                    sa.Column('id', sa.VARCHAR(length=36), autoincrement=False, nullable=False),
                    sa.Column('checksum', sa.VARCHAR(length=64), autoincrement=False, nullable=False),
                    sa.Column('finished_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
                    sa.Column('migration_name', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
                    sa.Column('logs', sa.TEXT(), autoincrement=False, nullable=True),
                    sa.Column('rolled_back_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False,
                              nullable=True),
                    sa.Column('started_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'),
                              autoincrement=False, nullable=False),
                    sa.Column('applied_steps_count', sa.INTEGER(), server_default=sa.text('0'), autoincrement=False,
                              nullable=False),
                    sa.PrimaryKeyConstraint('id', name='_prisma_migrations_pkey'),
                    schema='raw_data'
                    )
    # ### end Alembic commands ###
