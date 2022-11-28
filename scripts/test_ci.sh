#!/bin/env bash

status=0

npm run test:unit || status=1
npm run test:integration || status=1
# npm run test:database:init || status=1
# npm run test:database || status=1

exit $status
