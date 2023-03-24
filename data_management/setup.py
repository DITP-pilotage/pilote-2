from setuptools import setup, find_packages

setup(
    name='data-factory',
    version='0.1.0',
    author='OCTO Technology',
    install_requires=['dbt-duckdb==1.2',
                      'dbt-fal==1.3',
                      'dbt-postgres==1.3',
                      'fal==0.7',
                      'python-dotenv==0.21'],

    python_requires='>=3.9.15',
    py_modules=[],
)
