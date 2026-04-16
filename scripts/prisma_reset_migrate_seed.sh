#!/bin/sh

pnpm database:init-force # "prisma db seed" est exécuté ici automatiquement
pnpm exec prisma generate
