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
# [log] Show path of env just created
RUN pipenv --venv
# [log] Show versions of packages installed in env just created
RUN pipenv run pip freeze


# Install deps
COPY data_factory data_factory/
COPY profiles.yml .
RUN pipenv run dbt deps --profiles-dir . --project-dir data_factory

# Copy rest of the files
COPY . .

# Start entrypoint.sh script
ENTRYPOINT ["/bin/bash", "entrypoint.sh"]
