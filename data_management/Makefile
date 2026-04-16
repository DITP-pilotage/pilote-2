lint-sql:
	pipenv sync &&\
	pipenv run sqlfluff fix models/ || \
	pipenv run sqlfluff lint models/
