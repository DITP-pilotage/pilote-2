#!/bin/env bash

status=0

npm run test:client:unit || status=1
npm run test:client:integration || status=1
npm run test:server:unit || status=1
npm run test:database:init || status=1
npm run test:server:integration || status=1

exit $status
