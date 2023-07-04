FROM python:3.9.16

WORKDIR /app

# Copy config files
COPY Pipfile .
# COPY Pipfile.lock . #1

# Install pipenv (last version)
RUN python -m pip install --no-cache pipenv
# Install dbt (last version)
RUN python -m pip install --no-cache dbt-core


# Install dependencies of Pipfile
RUN pipenv lock #1
RUN pipenv sync
RUN pipenv --venv
RUN pipenv run pip freeze

# Copy rest of the files
COPY . .

# Start entrupoint.sh script
ENTRYPOINT ["/bin/bash", "entrypoint.sh"]
