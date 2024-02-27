FROM scalingo/scalingo-22:v7

WORKDIR /app

RUN git clone https://github.com/Scalingo/nodejs-buildpack/ /buildpack-node --depth 1
RUN git clone https://github.com/Scalingo/python-buildpack /buildpack-python --depth 1


#COPY entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
