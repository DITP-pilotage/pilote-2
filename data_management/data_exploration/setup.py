from setuptools import setup, find_packages

setup(
    name='ditp-exploration',
    version='0.1.0',
    packages=find_packages(
        where='src'
    ),
    package_dir={"": "src"},
    author='OCTO Technology',
    install_requires=['jupyterlab',
                      'pandas==1.5.1',
                      'psycopg2-binary',
                      'pandas-profiling[notebook]',
                      'python-dotenv',
                      'sqlalchemy'],

    python_requires='>=3.9',
)
