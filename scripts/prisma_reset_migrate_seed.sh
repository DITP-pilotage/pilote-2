#!/bin/sh

npm run database:init-force # "prisma db seed" est exécuté ici automatiquement
npx prisma generate
