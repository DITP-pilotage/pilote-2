descente:
	(cd ../pilote-ppg &&\
	pnpm i) &&\
	uv run bash pilote-ppg/scripts/daily/romain.sh

docker-up:
	cd ../pilote-ppg &&\
	docker compose up postgres

docs:
	pipenv run dbt docs generate && pipenv run dbt docs serve --port 8081

lint-sql:
	uv run sqlfluff fix models/ || \
	uv run sqlfluff lint models/


tunnel-dev:
	scalingo -a dev-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL

tunnel-prod:
	scalingo -a prod-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL
