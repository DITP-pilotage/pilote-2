#!/bin/sh

npm run database:init-force
npx prisma generate
