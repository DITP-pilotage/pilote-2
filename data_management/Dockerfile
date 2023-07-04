FROM python:3.9.16

WORKDIR /app
COPY .env .


RUN python --version

RUN python -m pip install --no-cache pipenv


COPY Pipfile .
COPY Pipfile.lock .

# dl pipenv dependencies
#RUN touch Pipfile.lock
RUN ls
#RUN pipenv install --system --deploy --ignore-pipfile
# https://stackoverflow.com/a/68787552/21676629 On transforme les dependances pipenv en requirements puis on installe avec pip
#RUN python -m pip install --no-cache pipenv  \
#    && pipenv requirements > requirements.txt \
#    && pip install -r requirements.txt
#RUN pipenv sync --system
RUN pipenv sync
#RUN pipenv shell
RUN python -m pip install --no-cache dbt-core
RUN python --version
#RUN dbt --version


COPY . .
#CMD ["deps", "--project-dir", "/data_factory"]
ENTRYPOINT ["/bin/bash", "entrypoint.sh"]
