FROM scalingo/scalingo-22:v7

RUN git clone https://github.com/Scalingo/nodejs-buildpack/ /buildpack-node --depth 1
RUN git clone https://github.com/Scalingo/python-buildpack /buildpack-python --depth 1

ENV STACK scalingo-22

WORKDIR /app

COPY . .
RUN /buildpack-node/bin/compile /app /tmp/cache /env
#RUN export PATH="/app/.scalingo/node/bin/":$PATH
ENV PATH="${PATH}:/app/.scalingo/node/bin/"

WORKDIR /app/data_management

RUN /buildpack-python/bin/compile /app/data_management /tmp/cache /env
ENV PATH="${PATH}:/app/data_management/.scalingo/python/bin/"
#ENV PATH "/app/.scalingo/python/bin/":$PATH



#RUN pip3 install pipenv
# Delete .env if exists. Will use .env.review instead
RUN rm -f .env ../.env
RUN rm -f ../.env
RUN mv .env.review .env
RUN pipenv lock
RUN pipenv sync

#RUN pipenv run echo $PGHOST
#RUN pipenv run /bin/bash scripts/run_datajobs.sh

#COPY entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "custom_build_image/entrypoint.sh"]
