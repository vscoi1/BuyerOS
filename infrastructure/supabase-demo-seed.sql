BEGIN;

INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
  ('org_demo', 'BuyerOS Demo Org', 'org-org_demo', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "updatedAt" = NOW();

INSERT INTO "Agent" ("id", "organizationId", "email", "name", "role", "stateFocus", "createdAt", "updatedAt")
VALUES
  ('agent_demo_1', 'org_demo', 'agent@buyersos.au', 'BuyerOS Demo Agent', 'ADMIN', ARRAY['NSW', 'VIC'], NOW(), NOW())
ON CONFLICT ("id") DO UPDATE
SET
  "organizationId" = EXCLUDED."organizationId",
  "email" = EXCLUDED."email",
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "stateFocus" = EXCLUDED."stateFocus",
  "updatedAt" = NOW();

INSERT INTO "Client" (
  "id",
  "organizationId",
  "agentId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "briefJson",
  "budgetMin",
  "budgetMax",
  "targetSuburbs",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'client_demo_1',
    'org_demo',
    'agent_demo_1',
    'Amelia',
    'Cooper',
    'amelia@example.com',
    '+61400000001',
    '{"summary":"Owner-occupier, 2 bed minimum, close to tram and schools.","mustHave":["2+ beds","walkable transport"],"states":["VIC"]}'::jsonb,
    950000,
    1200000,
    ARRAY['Brunswick', 'Northcote'],
    NOW(),
    NOW()
  ),
  (
    'client_demo_2',
    'org_demo',
    'agent_demo_1',
    'Noah',
    'Patel',
    'noah@example.com',
    '+61400000002',
    '{"summary":"Investor brief focused on yield and low vacancy risk.","mustHave":["yield >= 4%","growth corridor"],"states":["NSW"]}'::jsonb,
    800000,
    1050000,
    ARRAY['Ryde', 'Epping', 'Parramatta'],
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "organizationId" = EXCLUDED."organizationId",
  "agentId" = EXCLUDED."agentId",
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  "email" = EXCLUDED."email",
  "phone" = EXCLUDED."phone",
  "briefJson" = EXCLUDED."briefJson",
  "budgetMin" = EXCLUDED."budgetMin",
  "budgetMax" = EXCLUDED."budgetMax",
  "targetSuburbs" = EXCLUDED."targetSuburbs",
  "updatedAt" = NOW();

INSERT INTO "Property" (
  "id",
  "organizationId",
  "agentId",
  "clientId",
  "address",
  "suburb",
  "state",
  "postcode",
  "stage",
  "isOffMarket",
  "price",
  "matchScore",
  "riskFlags",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'property_demo_1',
    'org_demo',
    'agent_demo_1',
    'client_demo_1',
    '17 Albert St',
    'Brunswick',
    'VIC',
    '3056',
    'SHORTLISTED',
    FALSE,
    1110000,
    87,
    '["Body corporate minutes requested"]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'property_demo_2',
    'org_demo',
    'agent_demo_1',
    'client_demo_2',
    '8 Cedar Cl',
    'Ryde',
    'NSW',
    '2112',
    'DUE_DILIGENCE',
    TRUE,
    1820000,
    82,
    '["Flood overlay review required"]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'property_demo_3',
    'org_demo',
    'agent_demo_1',
    'client_demo_2',
    '42 River Rd',
    'Parramatta',
    'NSW',
    '2150',
    'SEARCHING',
    FALSE,
    965000,
    74,
    '[]'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "organizationId" = EXCLUDED."organizationId",
  "agentId" = EXCLUDED."agentId",
  "clientId" = EXCLUDED."clientId",
  "address" = EXCLUDED."address",
  "suburb" = EXCLUDED."suburb",
  "state" = EXCLUDED."state",
  "postcode" = EXCLUDED."postcode",
  "stage" = EXCLUDED."stage",
  "isOffMarket" = EXCLUDED."isOffMarket",
  "price" = EXCLUDED."price",
  "matchScore" = EXCLUDED."matchScore",
  "riskFlags" = EXCLUDED."riskFlags",
  "updatedAt" = NOW();

INSERT INTO "OffMarketSubmission" (
  "id",
  "organizationId",
  "sellingAgent",
  "agency",
  "address",
  "suburb",
  "state",
  "postcode",
  "askPrice",
  "status",
  "assignedAgentId",
  "createdAt"
)
VALUES
  (
    'off_market_demo_1',
    'org_demo',
    'Olivia Grant',
    'Bayside Realty',
    '8 Cedar Cl',
    'Ryde',
    'NSW',
    '2112',
    1820000,
    'ASSIGNED',
    'agent_demo_1',
    NOW()
  ),
  (
    'off_market_demo_2',
    'org_demo',
    'Ethan Clarke',
    'Northline Properties',
    '3 Murray St',
    'Northcote',
    'VIC',
    '3070',
    1295000,
    'NEW',
    NULL,
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "organizationId" = EXCLUDED."organizationId",
  "sellingAgent" = EXCLUDED."sellingAgent",
  "agency" = EXCLUDED."agency",
  "address" = EXCLUDED."address",
  "suburb" = EXCLUDED."suburb",
  "state" = EXCLUDED."state",
  "postcode" = EXCLUDED."postcode",
  "askPrice" = EXCLUDED."askPrice",
  "status" = EXCLUDED."status",
  "assignedAgentId" = EXCLUDED."assignedAgentId";

INSERT INTO "DueDiligenceReport" (
  "id",
  "propertyId",
  "floodRisk",
  "bushfireRisk",
  "zoningChangeFlag",
  "recentComparableDeltaPct",
  "riskScore",
  "flagsJson",
  "summary",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'dd_demo_1',
    'property_demo_1',
    'LOW',
    'LOW',
    FALSE,
    2.8,
    22,
    '["No critical legal flags detected"]'::jsonb,
    'Low-risk profile based on current overlays and comparables.',
    NOW(),
    NOW()
  )
ON CONFLICT ("propertyId") DO UPDATE
SET
  "floodRisk" = EXCLUDED."floodRisk",
  "bushfireRisk" = EXCLUDED."bushfireRisk",
  "zoningChangeFlag" = EXCLUDED."zoningChangeFlag",
  "recentComparableDeltaPct" = EXCLUDED."recentComparableDeltaPct",
  "riskScore" = EXCLUDED."riskScore",
  "flagsJson" = EXCLUDED."flagsJson",
  "summary" = EXCLUDED."summary",
  "updatedAt" = NOW();

INSERT INTO "ComplianceChecklist" (
  "id",
  "organizationId",
  "state",
  "policyVersion",
  "itemsJson",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'compliance_nsw_v1',
    'org_demo',
    'NSW',
    '2026.1',
    '[{"id":"nsw-1","label":"Agency agreement retained","status":"pending"},{"id":"nsw-2","label":"Cooling-off pathway reviewed","status":"pending"}]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'compliance_vic_v1',
    'org_demo',
    'VIC',
    '2026.1',
    '[{"id":"vic-1","label":"Section 32 reviewed","status":"pending"},{"id":"vic-2","label":"Auction authority confirmed","status":"pending"}]'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "organizationId" = EXCLUDED."organizationId",
  "state" = EXCLUDED."state",
  "policyVersion" = EXCLUDED."policyVersion",
  "itemsJson" = EXCLUDED."itemsJson",
  "updatedAt" = NOW();

INSERT INTO "AuditEvent" (
  "id",
  "organizationId",
  "actorId",
  "action",
  "entityType",
  "entityId",
  "metadataJson",
  "createdAt"
)
VALUES
  (
    'audit_demo_seed_1',
    'org_demo',
    'agent_demo_1',
    'seed.insert',
    'System',
    'supabase-demo-seed',
    '{"source":"infrastructure/supabase-demo-seed.sql","version":"2026.03.08"}'::jsonb,
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;

COMMIT;
