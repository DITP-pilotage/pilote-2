#!/bin/env bash

status=0

npx dotenv -e .env.ci -- npm run test:client:unit || status=1
npx dotenv -e .env.ci -- npm run test:client:integration || status=1
npx dotenv -e .env.ci -- npm run test:server:unit || status=1
npx dotenv -e .env.ci -- npm run database:init -- --force || status=1
npx dotenv -e .env.ci -- npm run test:server:integration || status=1

exit $status
