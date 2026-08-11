import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const jobs = await prisma.searchJob.findMany({
      orderBy: { searchedAt: 'desc' },
      take: 100,
    });

    const totalSearches = jobs.length;
    const totalResultsFound = jobs.reduce((acc, j) => acc + j.resultsFound, 0);
    const totalNewLeads = jobs.reduce((acc, j) => acc + j.newLeads, 0);
    const totalDuplicates = jobs.reduce((acc, j) => acc + j.duplicates, 0);

    return NextResponse.json({
      jobs,
      summary: {
        totalSearches,
        totalResultsFound,
        totalNewLeads,
        totalDuplicates,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
