import { prisma } from "./db.js";
import bcrypt from "bcrypt";

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      fullName: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "juan@example.com" },
    update: { passwordHash },
    create: {
      fullName: "Juan Dela Cruz",
      email: "juan@example.com",
      passwordHash,
      role: "staff",
    },
  });
  await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: { passwordHash },
    create: {
      fullName: "Maria Santos",
      email: "maria@example.com",
      passwordHash,
      role: "auditor",
    },
  });

  const categoryData = [
    {
      name: "Office Supplies",
      description: "Pens, paper, and desk essentials",
    },
    { name: "Hardware & Tools", description: "Hand tools and fasteners" },
    { name: "Cleaning Supplies", description: "Janitorial and cleaning items" },
    { name: "Electrical", description: "Bulbs, cords, and electrical parts" },
    { name: "Packaging", description: "Tapes, boxes, and shipping materials" },
  ];

  const categories = {};
  for (const c of categoryData) {
    const created = await prisma.category.create({ data: c });
    categories[created.name] = created.id;
  }

  const productData = [
    {
      sku: "OFC-001",
      name: "Ballpen (Black)",
      category: "Office Supplies",
      unit: "box",
    },
    {
      sku: "OFC-002",
      name: "Bond Paper A4",
      category: "Office Supplies",
      unit: "box",
    },
    {
      sku: "OFC-003",
      name: "Stapler",
      category: "Office Supplies",
      unit: "pcs",
    },
    {
      sku: "OFC-004",
      name: "Sticky Notes",
      category: "Office Supplies",
      unit: "box",
    },
    {
      sku: "HRD-001",
      name: "Claw Hammer",
      category: "Hardware & Tools",
      unit: "pcs",
    },
    {
      sku: "HRD-002",
      name: "Screwdriver Set",
      category: "Hardware & Tools",
      unit: "pcs",
    },
    {
      sku: "HRD-003",
      name: "Common Nails 3in",
      category: "Hardware & Tools",
      unit: "kg",
    },
    {
      sku: "CLN-001",
      name: "Floor Mop",
      category: "Cleaning Supplies",
      unit: "pcs",
    },
    {
      sku: "CLN-002",
      name: "Dishwashing Liquid 500ml",
      category: "Cleaning Supplies",
      unit: "pcs",
    },
    {
      sku: "ELC-001",
      name: "LED Bulb 9W",
      category: "Electrical",
      unit: "pcs",
    },
    {
      sku: "ELC-002",
      name: "Extension Cord 3m",
      category: "Electrical",
      unit: "pcs",
    },
    {
      sku: "PKG-001",
      name: "Packing Tape",
      category: "Packaging",
      unit: "box",
    },
    {
      sku: "PKG-002",
      name: "Carton Box Medium",
      category: "Packaging",
      unit: "pcs",
    },
  ];

  const products = {};
  for (const p of productData) {
    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        categoryId: categories[p.category],
        quantityOnHand: 0,
      },
    });
    products[created.sku] = created.id;
  }

  const movements = [
    {
      sku: "OFC-001",
      type: "stock_in",
      quantity: 200,
      reason: "Opening stock",
      ref: "PO-1001",
    },
    {
      sku: "OFC-001",
      type: "stock_out",
      quantity: 50,
      reason: "Issued to Sales dept",
      ref: "IS-2001",
    },
    {
      sku: "OFC-002",
      type: "stock_in",
      quantity: 100,
      reason: "Opening stock",
      ref: "PO-1002",
    },
    {
      sku: "OFC-002",
      type: "stock_out",
      quantity: 20,
      reason: "Issued to Admin dept",
      ref: "IS-2002",
    },
    {
      sku: "OFC-003",
      type: "stock_in",
      quantity: 25,
      reason: "Opening stock",
      ref: "PO-1003",
    },
    {
      sku: "OFC-004",
      type: "stock_in",
      quantity: 60,
      reason: "Opening stock",
      ref: "PO-1004",
    },
    {
      sku: "HRD-001",
      type: "stock_in",
      quantity: 18,
      reason: "Opening stock",
      ref: "PO-1005",
    },
    {
      sku: "HRD-002",
      type: "stock_in",
      quantity: 12,
      reason: "Opening stock",
      ref: "PO-1006",
    },
    {
      sku: "HRD-003",
      type: "stock_in",
      quantity: 50,
      reason: "Opening stock",
      ref: "PO-1007",
    },
    {
      sku: "HRD-003",
      type: "stock_out",
      quantity: 10,
      reason: "Used in repair",
      ref: "IS-2003",
    },
    {
      sku: "CLN-001",
      type: "stock_in",
      quantity: 20,
      reason: "Opening stock",
      ref: "PO-1008",
    },
    {
      sku: "CLN-002",
      type: "stock_in",
      quantity: 45,
      reason: "Opening stock",
      ref: "PO-1009",
    },
    {
      sku: "ELC-001",
      type: "stock_in",
      quantity: 120,
      reason: "Opening stock",
      ref: "PO-1010",
    },
    {
      sku: "ELC-001",
      type: "stock_out",
      quantity: 20,
      reason: "Installed in office",
      ref: "IS-2004",
    },
    {
      sku: "ELC-002",
      type: "stock_in",
      quantity: 22,
      reason: "Opening stock",
      ref: "PO-1011",
    },
    {
      sku: "PKG-001",
      type: "stock_in",
      quantity: 90,
      reason: "Opening stock",
      ref: "PO-1012",
    },
    {
      sku: "PKG-002",
      type: "stock_in",
      quantity: 70,
      reason: "Opening stock",
      ref: "PO-1013",
    },
  ];

  for (const m of movements) {
    await prisma.stockMovement.create({
      data: {
        productId: products[m.sku],
        movementType: m.type,
        quantity: m.quantity,
        referenceNo: m.ref,
        reason: m.reason,
        performedById: admin.id,
      },
    });

    if (m.type === "stock_in") {
      await prisma.product.update({
        where: { id: products[m.sku] },
        data: { quantityOnHand: { increment: m.quantity } },
      });
    } else if (m.type === "stock_out") {
      await prisma.product.update({
        where: { id: products[m.sku] },
        data: { quantityOnHand: { decrement: m.quantity } },
      });
    } else {
      await prisma.product.update({
        where: { id: products[m.sku] },
        data: { quantityOnHand: m.quantity },
      });
    }
  }

  console.log("Seed complete:");
  console.log(`  Categories: ${categoryData.length}`);
  console.log(`  Products:   ${productData.length}`);
  console.log(`  Movements:  ${movements.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
