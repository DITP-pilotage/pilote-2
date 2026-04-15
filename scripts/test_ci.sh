#!/bin/env bash

status=0

pnpm test:client:unit || status=1
pnpm test:client:integration || status=1
pnpm test:server:unit || status=1
pnpm test:database:init || status=1
pnpm test:server:integration || status=1

exit $status
