from setuptools import setup, find_packages

setup(
    name='ditp-exploration',
    version='0.1.0',
    packages=find_packages(),
    url='',
    license='',
    author='OCTO Technology',
    author_email='',
    description='',
    install_requires=['dnspython==2.1.0',
                      'great-expectations==0.15.33',
                      'ipykernel==6.17.1',
                      'pandas==1.5.1',
                      'psycopg2-binary==2.9.2',
                      'python-dateutil==2.8.2',
                      'python-dotenv==0.19.1',
                      'requests==2.27.1',
                      'structlog==21.3.0',
                      'Unidecode==1.3.2',
                      'PyYAML==6.0'],

    extras_require={'dev': ['flake8==4.0.1',
                            'flake8-quotes==3.3.1',
                            'freezegun==1.1.0',
                            'pytest==6.2.5',
                            'pre-commit==2.19.0'
                            ]},
    python_requires='>=3.9',
)
