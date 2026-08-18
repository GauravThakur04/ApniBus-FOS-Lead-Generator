import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Ensure PostgreSQL extensions & public schema tables exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "empId" TEXT UNIQUE,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL DEFAULT 'password123',
        "role" TEXT NOT NULL DEFAULT 'FOS',
        "designation" TEXT,
        "reportingManager" TEXT,
        "phone" TEXT,
        "state" TEXT,
        "cities" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT PRIMARY KEY,
        "placeId" TEXT UNIQUE,
        "businessName" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "website" TEXT,
        "address" TEXT,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "country" TEXT NOT NULL DEFAULT 'India',
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "googleMapsUrl" TEXT,
        "rating" DOUBLE PRECISION,
        "reviewCount" INTEGER DEFAULT 0,
        "source" TEXT NOT NULL DEFAULT 'Google Places',
        "searchKeyword" TEXT,
        "searchKeywordsHistory" TEXT,
        "leadScore" INTEGER NOT NULL DEFAULT 0,
        "leadTemperature" TEXT NOT NULL DEFAULT 'COLD',
        "status" TEXT NOT NULL DEFAULT 'New',
        "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        "lastContactedAt" TIMESTAMP(3),
        "nextFollowUpAt" TIMESTAMP(3),
        "notes" TEXT,
        "lastFoundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeadActivity" (
        "id" TEXT PRIMARY KEY,
        "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "id" TEXT PRIMARY KEY,
        "key" TEXT UNIQUE NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SearchJob" (
        "id" TEXT PRIMARY KEY,
        "state" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "keyword" TEXT NOT NULL,
        "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "resultsFound" INTEGER NOT NULL DEFAULT 0,
        "newLeads" INTEGER NOT NULL DEFAULT 0,
        "duplicates" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'Completed',
        "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL
      );
    `);

    // 1. Seed Admin User
    const admin = await prisma.user.upsert({
      where: { email: 'admin@apnibus.in' },
      update: {
        name: 'Admin Master',
        role: 'SUPER_ADMIN',
        designation: 'Super Admin',
      },
      create: {
        name: 'Admin Master',
        email: 'admin@apnibus.in',
        password: 'password123',
        role: 'SUPER_ADMIN',
        phone: '+919876543210',
        empId: 'ADMIN',
        designation: 'Super Admin',
        active: true,
      },
    });

    // 2. Seed Designated Leaders & Team Members
    const leadersData = [
      {
        empId: 'SUPER_GAURAV',
        name: 'Gaurav Thakur',
        email: 'gaurav.thakur@apnibus.com',
        phone: '9999999999',
        role: 'SUPER_ADMIN',
        designation: 'Super Admin',
        state: 'Haryana',
        cities: 'All India',
        reportingManager: null,
      },
      {
        empId: 'SUPER_ARVIND',
        name: 'Arvind Ranjan',
        email: 'arvind.ranjan@apnibus.com',
        phone: '9888888888',
        role: 'SUPER_ADMIN',
        designation: 'Super Admin',
        state: 'Haryana',
        cities: 'All India',
        reportingManager: null,
      },
      {
        empId: 'AB024',
        name: 'Sonu Mishra',
        email: 'sonu.mishra@apnibus.com',
        phone: '8750710855',
        role: 'RH',
        designation: 'Regional Head (RH)',
        state: 'Haryana',
        cities: 'Gurgaon / Haryana',
        reportingManager: null,
      },
      {
        empId: 'AB407',
        name: 'Tarun Kumar',
        email: 'tarun.kumar@apnibus.com',
        phone: '8194815508',
        role: 'RH',
        designation: 'Regional Head (RH)',
        state: 'Haryana',
        cities: 'Gurgaon / Haryana',
        reportingManager: null,
      },
      {
        empId: 'AB012',
        name: 'Rajnish',
        email: 'rajnish.kumar@apnibus.com',
        phone: '9341643122',
        role: 'RH',
        designation: 'Regional Head (RH)',
        state: 'Haryana',
        cities: 'Gurgaon / Haryana',
        reportingManager: null,
      },
      {
        empId: 'ISA001',
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
        empId: 'ISA002',
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

    const seededLeaders = [];
    for (const l of leadersData) {
      const u = await prisma.user.upsert({
        where: { email: l.email },
        update: {
          name: l.name,
          phone: l.phone,
          role: l.role,
          designation: l.designation,
          state: l.state,
          cities: l.cities,
          reportingManager: l.reportingManager,
        },
        create: {
          empId: l.empId,
          name: l.name,
          email: l.email,
          phone: l.phone,
          role: l.role,
          designation: l.designation,
          reportingManager: l.reportingManager,
          state: l.state,
          cities: l.cities,
          password: 'password123',
          active: true,
        },
      });
      seededLeaders.push(u);
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema and sales team members seeded successfully!',
      admin,
      leaders: seededLeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
