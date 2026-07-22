/* Quick verification of hybrid pipeline DB output */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [heuristics, digests, analyses, executions, failures] =
    await Promise.all([
      prisma.heuristicMetadata.count(),
      prisma.repositoryDigest.count(),
      prisma.aIAnalysis.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          provider: true,
          model: true,
          mode: true,
          updatedAt: true,
        },
      }),
      prisma.providerExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          provider: true,
          model: true,
          success: true,
          latencyMs: true,
          createdAt: true,
        },
      }),
      prisma.providerFailure.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { provider: true, reason: true, createdAt: true },
      }),
    ]);

  console.log('HeuristicMetadata rows:', heuristics);
  console.log('RepositoryDigest rows:', digests);
  console.log('\nLatest AIAnalysis:');
  console.table(analyses);
  console.log('\nLatest ProviderExecution:');
  console.table(executions);
  console.log('\nLatest ProviderFailure:');
  console.table(failures);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
