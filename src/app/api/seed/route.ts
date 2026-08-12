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
        "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        "type" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "metadata" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FollowUp" (
        "id" TEXT PRIMARY KEY,
        "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
        "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        "followUpDate" TIMESTAMP(3) NOT NULL,
        "time" TEXT,
        "reason" TEXT,
        "notes" TEXT,
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
      message: 'Supabase tables created & database seeded successfully!',
      admin,
      leaders: seededLeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
