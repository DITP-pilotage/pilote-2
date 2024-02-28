FROM scalingo/scalingo-22:v7

RUN git clone https://github.com/Scalingo/nodejs-buildpack/ /buildpack-node --depth 1
RUN git clone https://github.com/Scalingo/python-buildpack /buildpack-python --depth 1

ENV STACK scalingo-22


RUN git clone --depth 1 https://github.com/DITP-pilotage/pilote-2.git --branch prod-env-docker --single-branch /app

RUN /buildpack-node/bin/compile /app /tmp/cache /env
ENV PATH="${PATH}:/app/.scalingo/node/bin/"

RUN /buildpack-python/bin/compile /app/data_management /tmp/cache /env
ENV PATH="${PATH}:/app/data_management/.scalingo/python/bin/"

WORKDIR /app/data_management

RUN pipenv lock
RUN pipenv sync

#RUN pipenv run /bin/bash scripts/run_datajobs.sh

CMD ["/bin/bash", "custom_build_image/entrypoint.sh"]
