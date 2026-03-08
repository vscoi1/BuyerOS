#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const targetDbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!targetDbUrl) {
  console.error("Error: DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
  process.exit(1);
}

process.env.DATABASE_URL = targetDbUrl;

const prisma = new PrismaClient();

async function seed() {
  await prisma.organization.upsert({
    where: { id: "org_demo" },
    update: {
      name: "BuyerOS Demo Org",
      slug: "org-org_demo",
    },
    create: {
      id: "org_demo",
      name: "BuyerOS Demo Org",
      slug: "org-org_demo",
    },
  });

  await prisma.agent.upsert({
    where: { id: "agent_demo_1" },
    update: {
      organizationId: "org_demo",
      email: "agent@buyersos.au",
      name: "BuyerOS Demo Agent",
      role: "ADMIN",
      stateFocus: ["NSW", "VIC"],
    },
    create: {
      id: "agent_demo_1",
      organizationId: "org_demo",
      email: "agent@buyersos.au",
      name: "BuyerOS Demo Agent",
      role: "ADMIN",
      stateFocus: ["NSW", "VIC"],
    },
  });

  await prisma.client.upsert({
    where: { id: "client_demo_1" },
    update: {
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      firstName: "Amelia",
      lastName: "Cooper",
      email: "amelia@example.com",
      phone: "+61400000001",
      briefJson: {
        summary: "Owner-occupier, 2 bed minimum, close to tram and schools.",
        mustHave: ["2+ beds", "walkable transport"],
        states: ["VIC"],
      },
      budgetMin: 950000,
      budgetMax: 1200000,
      targetSuburbs: ["Brunswick", "Northcote"],
    },
    create: {
      id: "client_demo_1",
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      firstName: "Amelia",
      lastName: "Cooper",
      email: "amelia@example.com",
      phone: "+61400000001",
      briefJson: {
        summary: "Owner-occupier, 2 bed minimum, close to tram and schools.",
        mustHave: ["2+ beds", "walkable transport"],
        states: ["VIC"],
      },
      budgetMin: 950000,
      budgetMax: 1200000,
      targetSuburbs: ["Brunswick", "Northcote"],
    },
  });

  await prisma.client.upsert({
    where: { id: "client_demo_2" },
    update: {
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      firstName: "Noah",
      lastName: "Patel",
      email: "noah@example.com",
      phone: "+61400000002",
      briefJson: {
        summary: "Investor brief focused on yield and low vacancy risk.",
        mustHave: ["yield >= 4%", "growth corridor"],
        states: ["NSW"],
      },
      budgetMin: 800000,
      budgetMax: 1050000,
      targetSuburbs: ["Ryde", "Epping", "Parramatta"],
    },
    create: {
      id: "client_demo_2",
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      firstName: "Noah",
      lastName: "Patel",
      email: "noah@example.com",
      phone: "+61400000002",
      briefJson: {
        summary: "Investor brief focused on yield and low vacancy risk.",
        mustHave: ["yield >= 4%", "growth corridor"],
        states: ["NSW"],
      },
      budgetMin: 800000,
      budgetMax: 1050000,
      targetSuburbs: ["Ryde", "Epping", "Parramatta"],
    },
  });

  await prisma.property.upsert({
    where: { id: "property_demo_1" },
    update: {
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_1",
      address: "17 Albert St",
      suburb: "Brunswick",
      state: "VIC",
      postcode: "3056",
      stage: "SHORTLISTED",
      isOffMarket: false,
      price: 1110000,
      matchScore: 87,
      riskFlags: ["Body corporate minutes requested"],
    },
    create: {
      id: "property_demo_1",
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_1",
      address: "17 Albert St",
      suburb: "Brunswick",
      state: "VIC",
      postcode: "3056",
      stage: "SHORTLISTED",
      isOffMarket: false,
      price: 1110000,
      matchScore: 87,
      riskFlags: ["Body corporate minutes requested"],
    },
  });

  await prisma.property.upsert({
    where: { id: "property_demo_2" },
    update: {
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_2",
      address: "8 Cedar Cl",
      suburb: "Ryde",
      state: "NSW",
      postcode: "2112",
      stage: "DUE_DILIGENCE",
      isOffMarket: true,
      price: 1820000,
      matchScore: 82,
      riskFlags: ["Flood overlay review required"],
    },
    create: {
      id: "property_demo_2",
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_2",
      address: "8 Cedar Cl",
      suburb: "Ryde",
      state: "NSW",
      postcode: "2112",
      stage: "DUE_DILIGENCE",
      isOffMarket: true,
      price: 1820000,
      matchScore: 82,
      riskFlags: ["Flood overlay review required"],
    },
  });

  await prisma.property.upsert({
    where: { id: "property_demo_3" },
    update: {
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_2",
      address: "42 River Rd",
      suburb: "Parramatta",
      state: "NSW",
      postcode: "2150",
      stage: "SEARCHING",
      isOffMarket: false,
      price: 965000,
      matchScore: 74,
      riskFlags: [],
    },
    create: {
      id: "property_demo_3",
      organizationId: "org_demo",
      agentId: "agent_demo_1",
      clientId: "client_demo_2",
      address: "42 River Rd",
      suburb: "Parramatta",
      state: "NSW",
      postcode: "2150",
      stage: "SEARCHING",
      isOffMarket: false,
      price: 965000,
      matchScore: 74,
      riskFlags: [],
    },
  });

  await prisma.offMarketSubmission.upsert({
    where: { id: "off_market_demo_1" },
    update: {
      organizationId: "org_demo",
      sellingAgent: "Olivia Grant",
      agency: "Bayside Realty",
      address: "8 Cedar Cl",
      suburb: "Ryde",
      state: "NSW",
      postcode: "2112",
      askPrice: 1820000,
      status: "ASSIGNED",
      assignedAgentId: "agent_demo_1",
    },
    create: {
      id: "off_market_demo_1",
      organizationId: "org_demo",
      sellingAgent: "Olivia Grant",
      agency: "Bayside Realty",
      address: "8 Cedar Cl",
      suburb: "Ryde",
      state: "NSW",
      postcode: "2112",
      askPrice: 1820000,
      status: "ASSIGNED",
      assignedAgentId: "agent_demo_1",
    },
  });

  await prisma.offMarketSubmission.upsert({
    where: { id: "off_market_demo_2" },
    update: {
      organizationId: "org_demo",
      sellingAgent: "Ethan Clarke",
      agency: "Northline Properties",
      address: "3 Murray St",
      suburb: "Northcote",
      state: "VIC",
      postcode: "3070",
      askPrice: 1295000,
      status: "NEW",
      assignedAgentId: null,
    },
    create: {
      id: "off_market_demo_2",
      organizationId: "org_demo",
      sellingAgent: "Ethan Clarke",
      agency: "Northline Properties",
      address: "3 Murray St",
      suburb: "Northcote",
      state: "VIC",
      postcode: "3070",
      askPrice: 1295000,
      status: "NEW",
      assignedAgentId: null,
    },
  });

  await prisma.dueDiligenceReport.upsert({
    where: { propertyId: "property_demo_1" },
    update: {
      floodRisk: "LOW",
      bushfireRisk: "LOW",
      zoningChangeFlag: false,
      recentComparableDeltaPct: 2.8,
      riskScore: 22,
      flagsJson: ["No critical legal flags detected"],
      summary: "Low-risk profile based on current overlays and comparables.",
    },
    create: {
      id: "dd_demo_1",
      propertyId: "property_demo_1",
      floodRisk: "LOW",
      bushfireRisk: "LOW",
      zoningChangeFlag: false,
      recentComparableDeltaPct: 2.8,
      riskScore: 22,
      flagsJson: ["No critical legal flags detected"],
      summary: "Low-risk profile based on current overlays and comparables.",
    },
  });

  await prisma.complianceChecklist.upsert({
    where: { id: "compliance_nsw_v1" },
    update: {
      organizationId: "org_demo",
      state: "NSW",
      policyVersion: "2026.1",
      itemsJson: [
        { id: "nsw-1", label: "Agency agreement retained", status: "pending" },
        { id: "nsw-2", label: "Cooling-off pathway reviewed", status: "pending" },
      ],
    },
    create: {
      id: "compliance_nsw_v1",
      organizationId: "org_demo",
      state: "NSW",
      policyVersion: "2026.1",
      itemsJson: [
        { id: "nsw-1", label: "Agency agreement retained", status: "pending" },
        { id: "nsw-2", label: "Cooling-off pathway reviewed", status: "pending" },
      ],
    },
  });

  await prisma.complianceChecklist.upsert({
    where: { id: "compliance_vic_v1" },
    update: {
      organizationId: "org_demo",
      state: "VIC",
      policyVersion: "2026.1",
      itemsJson: [
        { id: "vic-1", label: "Section 32 reviewed", status: "pending" },
        { id: "vic-2", label: "Auction authority confirmed", status: "pending" },
      ],
    },
    create: {
      id: "compliance_vic_v1",
      organizationId: "org_demo",
      state: "VIC",
      policyVersion: "2026.1",
      itemsJson: [
        { id: "vic-1", label: "Section 32 reviewed", status: "pending" },
        { id: "vic-2", label: "Auction authority confirmed", status: "pending" },
      ],
    },
  });

  await prisma.auditEvent.upsert({
    where: { id: "audit_demo_seed_1" },
    update: {
      organizationId: "org_demo",
      actorId: "agent_demo_1",
      action: "seed.insert",
      entityType: "System",
      entityId: "supabase-demo-seed",
      metadataJson: {
        source: "scripts/db-seed-supabase.mjs",
        version: "2026.03.08",
      },
    },
    create: {
      id: "audit_demo_seed_1",
      organizationId: "org_demo",
      actorId: "agent_demo_1",
      action: "seed.insert",
      entityType: "System",
      entityId: "supabase-demo-seed",
      metadataJson: {
        source: "scripts/db-seed-supabase.mjs",
        version: "2026.03.08",
      },
    },
  });

  const [clientCount, propertyCount, offMarketCount] = await Promise.all([
    prisma.client.count({ where: { organizationId: "org_demo", agentId: "agent_demo_1" } }),
    prisma.property.count({ where: { organizationId: "org_demo", agentId: "agent_demo_1" } }),
    prisma.offMarketSubmission.count({ where: { organizationId: "org_demo" } }),
  ]);

  console.log(
    `Seed complete: clients=${clientCount}, properties=${propertyCount}, offMarket=${offMarketCount}`,
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
