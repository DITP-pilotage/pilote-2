#!/bin/env bash

status=0

npm run test:unit || status=1
npm run test:integration || status=1
npm run test:database:init:ci || status=1
npm run test:database:ci || status=1

exit $status
