descente:
	(cd ../pilote-ppg &&\
	pnpm i) &&\
	UV_ENV_FILE=.env uv run bash ../pilote-ppg/scripts/daily/romain.sh

docker-up:
	cd ../pilote-ppg &&\
	docker compose up postgres

docs:
	UV_ENV_FILE=.env uv run dbt docs generate && uv run dbt docs serve --port 8081

lint-sql:
	UV_ENV_FILE=.env uv run sqlfluff fix models/ || \
	UV_ENV_FILE=.env uv run sqlfluff lint models/


tunnel-dev:
	scalingo -a dev-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL

tunnel-prod:
	scalingo -a prod-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL
