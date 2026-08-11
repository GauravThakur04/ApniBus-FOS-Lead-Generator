import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const fosUsers = await prisma.user.findMany({
      where: {
        role: { in: ['FOS', 'RH', 'TL', 'BD', 'ISA', 'SALES_MANAGER'] },
        active: true,
      },
      include: {
        assignedLeads: true,
        followUps: true,
      },
    });

    const performanceData = fosUsers.map((user) => {
      const leads = user.assignedLeads || [];
      const totalAssigned = leads.length;
      const contacted = leads.filter((l) =>
        ['Contacted', 'Interested', 'Follow-up', 'Demo Scheduled', 'Demo Completed', 'Converted'].includes(l.status)
      ).length;
      const demos = leads.filter((l) =>
        ['Demo Scheduled', 'Demo Completed', 'Converted'].includes(l.status)
      ).length;
      const converted = leads.filter((l) => l.status === 'Converted').length;

      const contactRate = totalAssigned > 0 ? ((contacted / totalAssigned) * 100).toFixed(1) : '0';
      const conversionRate = totalAssigned > 0 ? ((converted / totalAssigned) * 100).toFixed(1) : '0';

      return {
        id: user.id,
        empId: user.empId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation || user.role,
        reportingManager: user.reportingManager,
        state: user.state,
        cities: user.cities,
        active: user.active,
        metrics: {
          totalAssigned,
          contacted,
          demos,
          converted,
          contactRate,
          conversionRate,
        },
      };
    });

    // Leaderboard sorting:
    // 1. Converted Sales
    // 2. Conversion Rate %
    // 3. Total Assigned Leads
    performanceData.sort((a, b) => {
      if (b.metrics.converted !== a.metrics.converted) {
        return b.metrics.converted - a.metrics.converted;
      }
      if (parseFloat(b.metrics.conversionRate) !== parseFloat(a.metrics.conversionRate)) {
        return parseFloat(b.metrics.conversionRate) - parseFloat(a.metrics.conversionRate);
      }
      return b.metrics.totalAssigned - a.metrics.totalAssigned;
    });

    return NextResponse.json({ fosPerformance: performanceData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
