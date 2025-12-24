import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import type { DecodedTokenWithRole } from "../../../types/api.js";

function initAdminOnce() {
  if (getApps().length) return;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      return;
    }
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) throw new Error("Missing Firebase admin credentials");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    throw error;
  }
}

initAdminOnce();

const db = getFirestore();

async function verifyAdmin(
  req: VercelRequest
): Promise<{ ok: boolean; reason?: string; email?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, reason: "missing-bearer" };
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const email = (decodedToken.email || "").toLowerCase();

    // Firestore role check
    let firestoreRole: string | undefined;
    try {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      firestoreRole = (
        userDoc.data()?.role as string | undefined
      )?.toLowerCase();
      if (userDoc.exists && userDoc.data()?.isAdmin === true)
        firestoreRole = "admin";
    } catch (e) {
      console.warn("verifyAdmin Firestore role lookup failed", e);
    }

    // Custom claims role
    const claimsRole = String(
      (decodedToken as DecodedTokenWithRole).role || ""
    ).toLowerCase();

    // Allowlist fallback
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(/[\n,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set(rawAllow);
    const isAdmin =
      [firestoreRole, claimsRole].includes("admin") || allow.has(email);
    return { ok: isAdmin, reason: isAdmin ? undefined : "not-admin", email };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { ok: false, reason: "token-invalid" };
  }
}

interface ReportData {
  analytics: {
    sessions: number;
    pageViews: number;
    users: number;
    avgDuration: number;
    bounceRate: number;
  };
  orders: {
    total: number;
    revenue: number;
    avgOrderValue: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResponseTime: number;
  };
  topProducts: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    sessions: number;
    orders: number;
    revenue: number;
  }>;
}

async function fetchReportData(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const startTimestamp = Timestamp.fromDate(startOfDay(startDate));
  const endTimestamp = Timestamp.fromDate(endOfDay(endDate));

  const sessionsSnapshot = await db
    .collection("analytics_sessions")
    .where("startTime", ">=", startTimestamp)
    .where("startTime", "<=", endTimestamp)
    .get();

  const pageViewsSnapshot = await db
    .collection("analytics_pageviews")
    .where("timestamp", ">=", startTimestamp)
    .where("timestamp", "<=", endTimestamp)
    .get();

  const ordersSnapshot = await db
    .collection("orders")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();

  const usersSnapshot = await db
    .collection("users")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();

  const ticketsSnapshot = await db
    .collection("support_tickets")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();

  const sessions = sessionsSnapshot.docs;
  const totalDuration = sessions.reduce(
    (sum, doc) => sum + (doc.data().duration || 0),
    0
  );
  const bouncedSessions = sessions.filter(
    (doc) => (doc.data().pageViews || 0) <= 1
  ).length;

  const orders = ordersSnapshot.docs;
  const totalRevenue = orders.reduce(
    (sum, doc) => sum + (doc.data().total || 0),
    0
  );
  const completedOrders = orders.filter(
    (doc) => doc.data().status === "completed"
  ).length;
  const pendingOrders = orders.filter((doc) =>
    ["pending", "processing", "building"].includes(doc.data().status)
  ).length;
  const cancelledOrders = orders.filter((doc) =>
    ["cancelled", "refunded"].includes(doc.data().status)
  ).length;

  const allUsersSnapshot = await db.collection("users").get();
  const returningCustomers = orders.filter((doc) => {
    const userId = doc.data().userId;
    const userOrders = orders.filter((o) => o.data().userId === userId);
    return userOrders.length > 1;
  }).length;

  const tickets = ticketsSnapshot.docs;
  const openTickets = tickets.filter(
    (doc) => doc.data().status === "open"
  ).length;
  const resolvedTickets = tickets.filter(
    (doc) => doc.data().status === "closed"
  ).length;
  const ticketsWithResponse = tickets.filter((doc) => doc.data().respondedAt);
  const avgResponseTime =
    ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum, doc) => {
          const created = doc.data().createdAt?.toDate();
          const responded = doc.data().respondedAt?.toDate();
          return (
            sum +
            (responded && created
              ? (responded.getTime() - created.getTime()) / 3600000
              : 0)
          );
        }, 0) / ticketsWithResponse.length
      : 0;

  const productOrders: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach((doc) => {
    const items = doc.data().items || [];
    items.forEach((item: any) => {
      const name = item.name || "Unknown";
      if (!productOrders[name]) {
        productOrders[name] = { orders: 0, revenue: 0 };
      }
      productOrders[name].orders += 1;
      productOrders[name].revenue += item.price || 0;
    });
  });

  const topProducts = Object.entries(productOrders)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const dailyData: Record<
    string,
    { sessions: number; orders: number; revenue: number }
  > = {};

  sessions.forEach((doc) => {
    const date = format(doc.data().startTime.toDate(), "yyyy-MM-dd");
    if (!dailyData[date])
      dailyData[date] = { sessions: 0, orders: 0, revenue: 0 };
    dailyData[date].sessions += 1;
  });

  orders.forEach((doc) => {
    const date = format(doc.data().createdAt.toDate(), "yyyy-MM-dd");
    if (!dailyData[date])
      dailyData[date] = { sessions: 0, orders: 0, revenue: 0 };
    dailyData[date].orders += 1;
    dailyData[date].revenue += doc.data().total || 0;
  });

  const dailyBreakdown = Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    analytics: {
      sessions: sessions.length,
      pageViews: pageViewsSnapshot.size,
      users: new Set(sessions.map((doc) => doc.data().userId)).size,
      avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      bounceRate:
        sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0,
    },
    orders: {
      total: orders.length,
      revenue: totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      completed: completedOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
    },
    customers: {
      total: allUsersSnapshot.size,
      new: usersSnapshot.size,
      returning: returningCustomers,
    },
    support: {
      totalTickets: tickets.length,
      openTickets,
      resolvedTickets,
      avgResponseTime,
    },
    topProducts,
    dailyBreakdown,
  };
}

function generatePDF(data: ReportData, startDate: Date, endDate: Date): Buffer {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  let logoData: string | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "vortexpcs-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.error("Failed to load logo:", error);
  }

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFillColor(3, 105, 161);
  doc.rect(0, 40, pageWidth, 10, "F");

  if (logoData) {
    try {
      const logoWidth = 54;
      const logoHeight = 10;
      const logoX = 15;
      const logoY = 15;
      doc.addImage(logoData, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Analytics Report", 15, 32);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(
    `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
    15,
    40
  );

  y = 50;

  doc.setFontSize(18);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Key Performance Metrics", 20, y);
  y += 12;

  const cardWidth = (pageWidth - 50) / 2;
  const cardHeight = 35;
  const cardSpacing = 10;

  const metrics = [
    {
      label: "Total Revenue",
      value: `GBP ${data.orders.revenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: [34, 197, 94],
      icon: "$",
    },
    {
      label: "Total Orders",
      value: data.orders.total.toLocaleString(),
      color: [59, 130, 246],
      icon: "#",
    },
    {
      label: "Total Sessions",
      value: data.analytics.sessions.toLocaleString(),
      color: [168, 85, 247],
      icon: "@",
    },
    {
      label: "Avg Order Value",
      value: `GBP ${data.orders.avgOrderValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: [251, 146, 60],
      icon: "=",
    },
  ];

  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 20 + col * (cardWidth + cardSpacing);
    const cardY = y + row * (cardHeight + cardSpacing);

    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "F");

    doc.setFillColor(255, 255, 255);
    doc.setGState(new doc.GState({ opacity: 0.95 }));
    doc.roundedRect(x + 2, cardY + 2, cardWidth - 4, cardHeight - 4, 2, 2, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setFontSize(20);
    doc.text(metric.icon, x + 8, cardY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, x + 8, cardY + 24);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + 8, cardY + 31);
  });

  y += 2 * (cardHeight + cardSpacing) + 15;

  doc.setFontSize(16);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Order Status Distribution", 20, y);
  y += 10;

  const chartData = [
    { label: "Completed", value: data.orders.completed, color: [34, 197, 94] },
    { label: "Pending", value: data.orders.pending, color: [251, 191, 36] },
    { label: "Cancelled", value: data.orders.cancelled, color: [239, 68, 68] },
  ];

  const chartWidth = pageWidth - 40;
  const chartHeight = 40;
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const barHeight = 10;
  const barSpacing = 8;

  chartData.forEach((item, index) => {
    const barY = y + index * (barHeight + barSpacing);
    const barWidth =
      maxValue > 0 ? (item.value / maxValue) * (chartWidth - 80) : 0;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(90, barY, chartWidth - 80, barHeight, 2, 2, "F");

    if (item.value > 0) {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.roundedRect(90, barY, barWidth, barHeight, 2, 2, "F");
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, 20, barY + 7);

    doc.setFont("helvetica", "bold");
    doc.text(item.value.toString(), chartWidth - 10, barY + 7, {
      align: "right",
    });
  });

  y += chartData.length * (barHeight + barSpacing) + 15;

  doc.addPage();
  y = 20;

  doc.setFontSize(20);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Analytics Overview", 20, y);
  y += 15;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Sessions", data.analytics.sessions.toLocaleString()],
      ["Page Views", data.analytics.pageViews.toLocaleString()],
      ["Unique Users", data.analytics.users.toLocaleString()],
      [
        "Avg Session Duration",
        `${(data.analytics.avgDuration / 60).toFixed(1)} minutes`,
      ],
      ["Bounce Rate", `${data.analytics.bounceRate.toFixed(1)}%`],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right" },
    },
  });

  y = doc.lastAutoTable.finalY + 20;

  if (data.dailyBreakdown.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.setFont("helvetica", "bold");
    doc.text("Revenue Trend (Last 7 Days)", 20, y);
    y += 10;

    const lineChartWidth = pageWidth - 50;
    const lineChartHeight = 60;
    const lineChartX = 25;
    const lineChartY = y;

    const recentDays = data.dailyBreakdown.slice(-7);
    const maxRevenue = Math.max(...recentDays.map((d) => d.revenue), 1);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(lineChartX, lineChartY, lineChartX, lineChartY + lineChartHeight);
    doc.line(
      lineChartX,
      lineChartY + lineChartHeight,
      lineChartX + lineChartWidth,
      lineChartY + lineChartHeight
    );

    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(2);

    const pointSpacing = lineChartWidth / (recentDays.length - 1 || 1);

    recentDays.forEach((day, index) => {
      const x = lineChartX + index * pointSpacing;
      const yValue =
        lineChartY +
        lineChartHeight -
        (day.revenue / maxRevenue) * (lineChartHeight - 10);

      if (index > 0) {
        const prevDay = recentDays[index - 1];
        const prevX = lineChartX + (index - 1) * pointSpacing;
        const prevY =
          lineChartY +
          lineChartHeight -
          (prevDay.revenue / maxRevenue) * (lineChartHeight - 10);
        doc.line(prevX, prevY, x, yValue);
      }

      doc.setFillColor(14, 165, 233);
      doc.circle(x, yValue, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      const dateLabel = format(new Date(day.date), "MMM dd");
      doc.text(dateLabel, x, lineChartY + lineChartHeight + 5, {
        align: "center",
      });

      if (index % 2 === 0) {
        doc.setFontSize(8);
        doc.text(`£${day.revenue.toFixed(0)}`, x, yValue - 3, {
          align: "center",
        });
      }
    });

    y += lineChartHeight + 20;
  }

  doc.addPage();
  y = 20;

  doc.setFontSize(20);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Top 10 Products by Revenue", 20, y);
  y += 15;

  const topProducts = data.topProducts.slice(0, 10);
  if (topProducts.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Rank", "Product Name", "Orders", "Revenue"]],
      body: topProducts.map((product, index) => [
        (index + 1).toString(),
        product.name.length > 50
          ? product.name.substring(0, 50) + "..."
          : product.name,
        product.orders.toString(),
        `£${product.revenue.toFixed(2)}`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: 100 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "right", cellWidth: 30 },
      },
    });
  }

  y = doc.lastAutoTable.finalY + 20;

  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Metrics", 20, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Customers", data.customers.total.toLocaleString()],
      ["New Customers", data.customers.new.toString()],
      ["Returning Customers", data.customers.returning.toString()],
    ],
    theme: "striped",
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right" },
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(16);
  doc.setTextColor(14, 165, 233);
  doc.setFont("helvetica", "bold");
  doc.text("Support Performance", 20, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Tickets", data.support.totalTickets.toString()],
      ["Open Tickets", data.support.openTickets.toString()],
      ["Resolved Tickets", data.support.resolvedTickets.toString()],
      ["Avg Response Time", `${data.support.avgResponseTime.toFixed(1)} hours`],
    ],
    theme: "striped",
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right" },
    },
  });

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont("helvetica", "normal");
    doc.text("Vortex PCs Analytics Report", 20, pageHeight - 10);
    doc.text(
      `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
      pageWidth / 2,
      pageHeight - 10,
      {
        align: "center",
      }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, {
      align: "right",
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function generateExcel(
  data: ReportData,
  startDate: Date,
  endDate: Date
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [{ width: 35 }, { width: 20 }];

  summarySheet.addRow(["Vortex PCs Analytics Report"]);
  summarySheet.addRow([
    `Period: ${format(startDate, "MMM dd, yyyy")} - ${format(
      endDate,
      "MMM dd, yyyy"
    )}`,
  ]);
  summarySheet.addRow([]);
  summarySheet.addRow(["ANALYTICS OVERVIEW"]);
  summarySheet.addRow(["Total Sessions", data.analytics.sessions]);
  summarySheet.addRow(["Page Views", data.analytics.pageViews]);
  summarySheet.addRow(["Unique Users", data.analytics.users]);
  summarySheet.addRow([
    "Avg Session Duration (min)",
    (data.analytics.avgDuration / 60).toFixed(1),
  ]);
  summarySheet.addRow([
    "Bounce Rate (%)",
    data.analytics.bounceRate.toFixed(1),
  ]);
  summarySheet.addRow([]);
  summarySheet.addRow(["ORDER STATISTICS"]);
  summarySheet.addRow(["Total Orders", data.orders.total]);
  summarySheet.addRow(["Revenue (£)", data.orders.revenue.toFixed(2)]);
  summarySheet.addRow([
    "Avg Order Value (£)",
    data.orders.avgOrderValue.toFixed(2),
  ]);
  summarySheet.addRow(["Completed Orders", data.orders.completed]);
  summarySheet.addRow(["Pending Orders", data.orders.pending]);
  summarySheet.addRow(["Cancelled Orders", data.orders.cancelled]);
  summarySheet.addRow([]);
  summarySheet.addRow(["CUSTOMER METRICS"]);
  summarySheet.addRow(["Total Customers", data.customers.total]);
  summarySheet.addRow(["New Customers", data.customers.new]);
  summarySheet.addRow(["Returning Customers", data.customers.returning]);
  summarySheet.addRow([]);
  summarySheet.addRow(["SUPPORT PERFORMANCE"]);
  summarySheet.addRow(["Total Tickets", data.support.totalTickets]);
  summarySheet.addRow(["Open Tickets", data.support.openTickets]);
  summarySheet.addRow(["Resolved Tickets", data.support.resolvedTickets]);
  summarySheet.addRow([
    "Avg Response Time (hours)",
    data.support.avgResponseTime.toFixed(1),
  ]);

  const productsSheet = workbook.addWorksheet("Top Products");
  productsSheet.columns = [
    { header: "Rank", width: 8 },
    { header: "Product Name", width: 35 },
    { header: "Orders", width: 12 },
    { header: "Revenue (£)", width: 15 },
  ];
  data.topProducts.forEach((p, i) => {
    productsSheet.addRow([
      i + 1,
      p.name,
      p.orders,
      parseFloat(p.revenue.toFixed(2)),
    ]);
  });

  const dailySheet = workbook.addWorksheet("Daily Breakdown");
  dailySheet.columns = [
    { header: "Date", width: 15 },
    { header: "Sessions", width: 12 },
    { header: "Orders", width: 12 },
    { header: "Revenue (£)", width: 15 },
  ];
  data.dailyBreakdown.forEach((d) => {
    dailySheet.addRow([
      d.date,
      d.sessions,
      d.orders,
      parseFloat(d.revenue.toFixed(2)),
    ]);
  });

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.ok) {
    res.setHeader("X-Admin-Verify", adminCheck.reason || "failed");
    return res.status(403).json({
      error: "Unauthorized: Admin access required",
      reason: adminCheck.reason,
    });
  }

  try {
    const {
      format: formatType,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
    } = req.query;

    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr as string);
      endDate = new Date(endDateStr as string);
    } else if (period) {
      switch (period) {
        case "7days":
          startDate = subDays(new Date(), 7);
          break;
        case "30days":
          startDate = subDays(new Date(), 30);
          break;
        case "90days":
          startDate = subDays(new Date(), 90);
          break;
        case "thisMonth":
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case "lastMonth":
          startDate = startOfMonth(subMonths(new Date(), 1));
          endDate = endOfMonth(subMonths(new Date(), 1));
          break;
        case "thisYear":
          startDate = startOfYear(new Date());
          break;
        default:
          startDate = subDays(new Date(), 30);
      }
    } else {
      startDate = subDays(new Date(), 30);
    }

    const reportData = await fetchReportData(startDate, endDate);

    if (formatType === "pdf") {
      const pdfBuffer = generatePDF(reportData, startDate, endDate);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="vortex-report-${format(
          startDate,
          "yyyy-MM-dd"
        )}-to-${format(endDate, "yyyy-MM-dd")}.pdf"`
      );
      return res.send(pdfBuffer);
    }

    if (formatType === "excel" || formatType === "xlsx") {
      const excelBuffer = await generateExcel(reportData, startDate, endDate);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="vortex-report-${format(
          startDate,
          "yyyy-MM-dd"
        )}-to-${format(endDate, "yyyy-MM-dd")}.xlsx"`
      );
      return res.send(excelBuffer);
    }

    return res.status(200).json({
      success: true,
      period: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      },
      data: reportData,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({
      error: "Failed to generate report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
