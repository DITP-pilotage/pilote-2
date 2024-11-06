#!/bin/sh

npx prisma migrate reset --force
npx prisma generate
npx prisma migrate dev
npx prisma generate
