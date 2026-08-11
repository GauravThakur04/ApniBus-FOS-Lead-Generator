import { prisma } from './db';

export async function findFOSForCity(city: string, state: string): Promise<string | null> {
  // Find all active FOS users
  const fosUsers = await prisma.user.findMany({
    where: {
      role: 'FOS',
      active: true,
    },
    include: {
      _count: {
        select: { assignedLeads: true },
      },
    },
  });

  if (fosUsers.length === 0) return null;

  // Filter FOS whose assigned cities match the lead city (case-insensitive)
  const cityLower = city.trim().toLowerCase();
  const matchingFOS = fosUsers.filter((user) => {
    if (!user.cities) return false;
    const citiesList = user.cities.split(',').map((c) => c.trim().toLowerCase());
    return citiesList.includes(cityLower);
  });

  if (matchingFOS.length === 1) {
    return matchingFOS[0].id;
  }

  if (matchingFOS.length > 1) {
    // Round-robin: pick the FOS with the least assigned leads
    matchingFOS.sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
    return matchingFOS[0].id;
  }

  // Fallback: match by state
  const stateLower = state.trim().toLowerCase();
  const stateMatchingFOS = fosUsers.filter((user) => {
    return user.state && user.state.trim().toLowerCase() === stateLower;
  });

  if (stateMatchingFOS.length > 0) {
    stateMatchingFOS.sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
    return stateMatchingFOS[0].id;
  }

  return null;
}
