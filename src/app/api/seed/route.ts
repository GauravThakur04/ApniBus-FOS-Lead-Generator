import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Seed Admin User
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

    // 2. Seed the 3 Designated Leaders
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
    ];

    const seededLeaders = [];
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
      seededLeaders.push(u);
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase database initialized & seeded successfully!',
      admin,
      leaders: seededLeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
