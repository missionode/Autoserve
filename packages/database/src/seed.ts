import { PrismaClient } from '@prisma/client';

const database = new PrismaClient();
await database.foundationProbe.upsert({ where: { name: 'stage-4.1' }, update: {}, create: { name: 'stage-4.1' } });
await database.$disconnect();
