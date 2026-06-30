descente:
	cd ../pilote-ppg &&\
	pnpm i &&\
	bash scripts/daily/romain.sh

docker-up:
	cd ../pilote-ppg &&\
	docker compose up postgres

docs:
	pipenv run dbt docs generate && pipenv run dbt docs serve --port 8081

lint-sql:
	pipenv sync &&\
	pipenv run sqlfluff fix models/ || \
	pipenv run sqlfluff lint models/

reset-db:
	bash ../pilote-ppg/scripts/daily/romain.sh

tunnel-dev:
	scalingo -a dev-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL

tunnel-prod:
	scalingo -a prod-pilote-ditp --region osc-secnum-fr1 db-tunnel SCALINGO_POSTGRESQL_URL
