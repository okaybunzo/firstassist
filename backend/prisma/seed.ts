import "dotenv/config";
import { prisma } from "../src/db";
import { hashPassword } from "../src/services/auth";

async function ensureUser(email: string, password: string, name: string, role: "ADMIN" | "OFFICE" | "TECHNICIAN") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return existing;
  }
  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
  });
  console.log(`Created ${role.toLowerCase()} user: ${email}`);
  return user;
}

async function ensureDemoData() {
  const existingClient = await prisma.client.findFirst({ where: { name: "Acme Manufacturing" } });
  if (existingClient) {
    console.log("Demo data already exists, skipping.");
    return;
  }

  const client = await prisma.client.create({
    data: {
      name: "Acme Manufacturing",
      contactName: "Jordan Lee",
      email: "ops@acme-demo.local",
      phone: "555-0100",
      address: "100 Industrial Way, Springfield",
    },
  });

  const site = await prisma.site.create({
    data: { clientId: client.id, name: "Acme Main Plant", address: "100 Industrial Way, Springfield" },
  });

  const asset = await prisma.asset.create({
    data: {
      siteId: site.id,
      name: "Rooftop HVAC Unit 1",
      assetType: "HVAC",
      manufacturer: "Carrier",
      model: "48TC",
      serialNumber: "SN-48TC-0001",
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      assetId: asset.id,
      frequency: "QUARTERLY",
      nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "Standard quarterly HVAC service.",
    },
  });

  const form = await prisma.inspectionForm.create({
    data: {
      name: "HVAC Quarterly Checklist",
      description: "Standard quarterly HVAC inspection checklist.",
      fields: {
        create: [
          { label: "Filter condition", fieldType: "SELECT", options: "Good,Fair,Poor", order: 0 },
          { label: "Refrigerant level normal", fieldType: "BOOLEAN", order: 1 },
          { label: "Notes", fieldType: "TEXT", order: 2 },
        ],
      },
    },
  });
  console.log(`Created demo inspection form: ${form.name}`);

  const job = await prisma.job.create({
    data: {
      siteId: site.id,
      assetId: asset.id,
      title: "Q3 HVAC Maintenance",
      type: "MAINTENANCE",
      status: "SCHEDULED",
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const issue = await prisma.issue.create({
    data: {
      jobId: job.id,
      assetId: asset.id,
      description: "Drive belt shows visible wear, recommend replacement.",
      severity: "MEDIUM",
      status: "OPEN",
    },
  });

  const beltPart = await prisma.part.create({
    data: { sku: "BLT-A32", name: "V-Belt A32", unit: "ea", unitPrice: 18.5, category: "Belts" },
  });
  await prisma.part.create({
    data: { sku: "FLT-2020", name: "Air Filter 20x20", unit: "ea", unitPrice: 12.99, category: "Filters" },
  });

  await prisma.quoteItem.create({
    data: {
      issueId: issue.id,
      partId: beltPart.id,
      description: "Replace worn drive belt",
      quantity: 1,
      unitPrice: beltPart.unitPrice,
      status: "QUOTE_READY",
    },
  });

  console.log(`Created demo client "${client.name}" with site, asset, job, issue, parts, and quote item.`);
}

async function main() {
  await ensureUser(
    process.env.ADMIN_EMAIL ?? "admin@firstassist.local",
    process.env.ADMIN_PASSWORD ?? "changeme123",
    "Admin",
    "ADMIN"
  );
  await ensureUser("office@firstassist.local", "changeme123", "Office Staff", "OFFICE");
  await ensureUser("tech@firstassist.local", "changeme123", "Field Technician", "TECHNICIAN");
  await ensureDemoData();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
