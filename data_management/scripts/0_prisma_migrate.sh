#!/bin/sh

npx prisma migrate reset --force --schema ../src/database/prisma/schema.prisma
npx prisma generate --schema ../src/database/prisma/schema.prisma
npx prisma migrate dev --schema ../src/database/prisma/schema.prisma
npx prisma generate --schema ../src/database/prisma/schema.prisma
