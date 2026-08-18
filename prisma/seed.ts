import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ApniBus Lead Generator with ONLY the 3 designated leaders...');

  // Master Target States & Cities
  const stateCityMap: Record<string, string[]> = {
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Muktsar Sahib', 'Mansa'],
    'Haryana': ['Gurgaon', 'Gurugram', 'Rohtak', 'Sirsa', 'Hisar', 'Faridabad', 'Panipat', 'Karnal', 'Ambala'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kangra', 'Una', 'Chamba'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Roorkee', 'Haldwani', 'Nainital'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Barmer', 'Hanumangarh', 'Karauli', 'Bharatpur', 'Alwar', 'Sawai Madhopur', 'Jalore'],
    'Delhi': ['Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi', 'Dwarka'],
    'Uttar Pradesh': ['Greater Noida', 'Noida', 'Agra', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Meerut'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Betul', 'Kurawar', 'Gwalior', 'Jabalpur'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Bemetara', 'KCG'],
  };

  for (const [stateName, cities] of Object.entries(stateCityMap)) {
    const state = await prisma.state.upsert({
      where: { name: stateName },
      update: { active: true },
      create: { name: stateName, active: true },
    });

    for (const cityName of cities) {
      await prisma.city.upsert({
        where: {
          name_stateId: { name: cityName, stateId: state.id },
        },
        update: { active: true },
        create: { name: cityName, stateId: state.id, active: true },
      });
    }
  }

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apnibus.in' },
    update: {
      name: 'Admin User',
      empId: 'ADMIN',
      designation: 'Admin User',
    },
    create: {
      name: 'Admin User',
      email: 'admin@apnibus.in',
      password: 'password123',
      role: 'ADMIN',
      phone: '+919876543210',
      empId: 'ADMIN',
      designation: 'Admin User',
      active: true,
    },
  });

  // The 3 Designated Leaders ONLY
  const leadersData = [
    {
      empId: 'AB024',
      name: 'Sonu Mishra',
      email: 'sonu.mishra@apnibus.com',
      phone: '8750710855',
      designation: 'Regional Head (RH)',
      state: 'Haryana',
      cities: 'Gurgaon / Haryana',
    },
    {
      empId: 'AB407',
      name: 'Tarun Kumar',
      email: 'tarun.kumar@apnibus.com',
      phone: '8194815508',
      designation: 'Regional Head (RH)',
      state: 'Haryana',
      cities: 'Gurgaon / Haryana',
    },
    {
      empId: 'AB012',
      name: 'Rajnish',
      email: 'rajnish.kumar@apnibus.com',
      phone: '9341643122',
      designation: 'Regional Head (RH)',
      state: 'Haryana',
      cities: 'Gurgaon / Haryana',
    },
    {
      empId: 'ISA01',
      name: 'Utpal Mandal',
      email: 'utpalmandalfkk1234@gmail.com',
      phone: '9563080570',
      role: 'ISA',
      designation: 'ISA',
      reportingManager: 'rajnish.kumar@apnibus.com',
      state: 'Jharkhand',
      cities: 'Sahibganj',
    },
    {
      empId: 'ISA02',
      name: 'Deepak Saini',
      email: 'dks322001@gmail.com',
      phone: '7427056756',
      role: 'ISA',
      designation: 'ISA',
      reportingManager: 'rajnish.kumar@apnibus.com',
      state: 'Rajasthan',
      cities: 'Sawai Madhopur',
    },
  ];

  const createdLeaderIds: string[] = [];

  for (const l of leadersData) {
    const u = await prisma.user.upsert({
      where: { email: l.email },
      update: {
        name: l.name,
        phone: l.phone,
        empId: l.empId,
        designation: l.designation,
        state: l.state,
        cities: l.cities,
      },
      create: {
        name: l.name,
        email: l.email,
        phone: l.phone,
        password: 'password123',
        role: 'FOS',
        empId: l.empId,
        designation: l.designation,
        state: l.state,
        cities: l.cities,
        active: true,
      },
    });
    createdLeaderIds.push(u.id);
  }

  // Remove ALL other users from database except Admin and the 3 leaders
  const keepEmails = ['admin@apnibus.in', ...leadersData.map((d) => d.email)];
  
  const otherUsers = await prisma.user.findMany({
    where: { email: { notIn: keepEmails } },
  });

  const otherUserIds = otherUsers.map((u) => u.id);

  if (otherUserIds.length > 0) {
    // Reassign leads assigned to other users to one of the 3 leaders
    const leadsToReassign = await prisma.lead.findMany({
      where: { assignedToId: { in: otherUserIds } },
    });

    for (let i = 0; i < leadsToReassign.length; i++) {
      const leaderId = createdLeaderIds[i % createdLeaderIds.length];
      await prisma.lead.update({
        where: { id: leadsToReassign[i].id },
        data: { assignedToId: leaderId },
      });
    }

    // Delete follow-ups or activities for other users first to prevent foreign key errors
    await prisma.followUp.deleteMany({
      where: { userId: { in: otherUserIds } },
    });

    await prisma.leadActivity.deleteMany({
      where: { userId: { in: otherUserIds } },
    });

    // Now safely delete other users
    await prisma.user.deleteMany({
      where: { id: { in: otherUserIds } },
    });
  }

  // Reassign any remaining unassigned leads to these 3 leaders
  const unassignedLeads = await prisma.lead.findMany({
    where: { assignedToId: null },
  });

  for (let i = 0; i < unassignedLeads.length; i++) {
    const leaderId = createdLeaderIds[i % createdLeaderIds.length];
    await prisma.lead.update({
      where: { id: unassignedLeads[i].id },
      data: { assignedToId: leaderId },
    });
  }

  console.log('Seeding complete! Database now contains ONLY Admin User and the 3 leaders: Sonu Mishra, Tarun Kumar, and Rajnish.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
