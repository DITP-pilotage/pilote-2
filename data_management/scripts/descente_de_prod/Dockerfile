FROM postgres:16.1
WORKDIR /app

RUN apt-get update && apt-get install -y \
  curl \
  openssh-client \
  && rm -rf /var/lib/apt/lists/*

RUN curl --insecure -O https://cli-dl.scalingo.com/install && bash install
