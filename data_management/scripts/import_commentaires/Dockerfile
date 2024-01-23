FROM postgres:16.1

WORKDIR /app

# Create empty env to prevent crash when sourced by the import script. The actual .env is loaded in the compose stack.
RUN touch .env

ENTRYPOINT [ "/bin/bash" ]
CMD [ "import.sh" ]
