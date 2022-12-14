from setuptools import setup, find_packages

setup(
    name='pilote-data-jobs',
    version='0.1.0',
    packages=find_packages(),
    url='',
    license='',
    author='OCTO Technology',
    author_email='',
    description='',
    install_requires=[],
    extras_require={
      'postdeploy': ['alembic==1.7.6'],
      'transformation': ['dbt-postgres==1.3.1'],
    },
    python_requires='>=3.9.13',
)
