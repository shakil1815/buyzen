import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvResponse } from "@/lib/csv";
import { getAdminContext } from "@/lib/permissions";
import { audit } from "@/lib/audit";

type Permission =
  | "customers.export"
  | "customers.view"
  | "orders.view"
  | "payments.view"
  | "products.import"
  | "inventory.manage"
  | "reviews.moderate"
  | "marketing.manage"
  | "reports.view";

const PERMISSION_BY_TYPE: Record<string, Permission> = {
  customers: "customers.export",
  customer: "customers.export",
  orders: "orders.view",
  payments: "payments.view",
  products: "products.import",
  inventory: "inventory.manage",
  reviews: "reviews.moderate",
  coupons: "marketing.manage",
  refunds: "payments.view",
  revenue: "reports.view",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  const required = PERMISSION_BY_TYPE[type];
  if (!required) {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!admin.permissions.includes(required)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  if (type === "customers") {
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { phone: { contains: query } },
                { city: { contains: query } },
              ],
            }
          : {}),
      },
      include: { orders: { select: { total: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });

    await audit({
      actor: admin,
      action: "export.customers",
      entity: "User",
      meta: { count: customers.length },
    });

    return csvResponse(
      `buyzen-customers-${Date.now()}.csv`,
      customers.map((customer) => {
        const spent = customer.orders.reduce(
          (sum, order) => sum + order.total,
          0,
        );
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? "",
          city: customer.city ?? "",
          district: customer.district ?? "",
          division: customer.division ?? "",
          country: customer.country,
          registered: customer.createdAt.toISOString(),
          orders: customer.orders.length,
          spent: (spent / 100).toFixed(2),
          lastOrder: customer.orders[0]?.createdAt.toISOString() ?? "",
          status: customer.status,
          locationConsent: customer.locationConsent ? "yes" : "no",
        };
      }),
      [
        { key: "id", label: "Customer ID", value: (row) => row.id },
        { key: "name", label: "Full name", value: (row) => row.name },
        { key: "email", label: "Email", value: (row) => row.email },
        { key: "phone", label: "Phone", value: (row) => row.phone },
        { key: "city", label: "City", value: (row) => row.city },
        { key: "district", label: "District", value: (row) => row.district },
        { key: "division", label: "Division", value: (row) => row.division },
        { key: "country", label: "Country", value: (row) => row.country },
        {
          key: "registered",
          label: "Registration date",
          value: (row) => row.registered,
        },
        { key: "orders", label: "Total orders", value: (row) => row.orders },
        {
          key: "spent",
          label: "Total purchase amount (USD)",
          value: (row) => row.spent,
        },
        {
          key: "lastOrder",
          label: "Last order date",
          value: (row) => row.lastOrder,
        },
        { key: "status", label: "Account status", value: (row) => row.status },
        {
          key: "locationConsent",
          label: "Location consent",
          value: (row) => row.locationConsent,
        },
      ],
    );
  }

  if (type === "customer") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const customer = await prisma.user.findUnique({
      where: { id },
      include: { orders: { include: { items: true } } },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await audit({
      actor: admin,
      action: "export.customer",
      entity: "User",
      entityId: id,
    });

    return csvResponse(
      `buyzen-customer-${id}.csv`,
      customer.orders.map((order) => ({
        order: order.number,
        date: order.createdAt.toISOString(),
        status: order.status,
        payment: order.paymentMethod,
        total: (order.total / 100).toFixed(2),
        items: order.items
          .map((item) => `${item.name} x${item.quantity}`)
          .join(" | "),
      })),
      [
        { key: "order", label: "Order", value: (row) => row.order },
        { key: "date", label: "Date", value: (row) => row.date },
        { key: "status", label: "Status", value: (row) => row.status },
        { key: "payment", label: "Payment method", value: (row) => row.payment },
        { key: "total", label: "Total (USD)", value: (row) => row.total },
        { key: "items", label: "Items", value: (row) => row.items },
      ],
    );
  }

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    await audit({
      actor: admin,
      action: "export.orders",
      entity: "Order",
      meta: { count: orders.length },
    });
    return csvResponse(
      `buyzen-orders-${Date.now()}.csv`,
      orders.map((order) => ({
        number: order.number,
        date: order.createdAt.toISOString(),
        customer: order.shippingName,
        email: order.email,
        city: order.city,
        district: order.district ?? "",
        items: order.items
          .map((item) => `${item.name} x${item.quantity}`)
          .join(" | "),
        subtotal: (order.subtotal / 100).toFixed(2),
        discount: (order.discount / 100).toFixed(2),
        shipping: (order.shipping / 100).toFixed(2),
        tax: (order.tax / 100).toFixed(2),
        total: (order.total / 100).toFixed(2),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        tracking: order.trackingNumber ?? "",
      })),
      [
        { key: "number", label: "Order ID", value: (row) => row.number },
        { key: "date", label: "Date", value: (row) => row.date },
        { key: "customer", label: "Customer", value: (row) => row.customer },
        { key: "email", label: "Email", value: (row) => row.email },
        { key: "city", label: "City", value: (row) => row.city },
        { key: "district", label: "District", value: (row) => row.district },
        { key: "items", label: "Products", value: (row) => row.items },
        { key: "subtotal", label: "Subtotal", value: (row) => row.subtotal },
        { key: "discount", label: "Discount", value: (row) => row.discount },
        { key: "shipping", label: "Shipping", value: (row) => row.shipping },
        { key: "tax", label: "Tax", value: (row) => row.tax },
        { key: "total", label: "Total", value: (row) => row.total },
        { key: "status", label: "Order status", value: (row) => row.status },
        {
          key: "paymentStatus",
          label: "Payment status",
          value: (row) => row.paymentStatus,
        },
        {
          key: "paymentMethod",
          label: "Payment method",
          value: (row) => row.paymentMethod,
        },
        { key: "tracking", label: "Tracking", value: (row) => row.tracking },
      ],
    );
  }

  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      include: { order: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
    });
    await audit({
      actor: admin,
      action: "export.payments",
      entity: "Payment",
      meta: { count: payments.length },
    });
    return csvResponse(
      `buyzen-payments-${Date.now()}.csv`,
      payments.map((payment) => ({
        order: payment.order.number,
        method: payment.method,
        amount: (payment.amount / 100).toFixed(2),
        reference: payment.reference ?? "",
        sender: payment.senderNumber ?? "",
        status: payment.status,
        verifiedBy: payment.verifiedBy ?? "",
        date: payment.createdAt.toISOString(),
      })),
      [
        { key: "order", label: "Order", value: (row) => row.order },
        { key: "method", label: "Method", value: (row) => row.method },
        { key: "amount", label: "Amount", value: (row) => row.amount },
        { key: "reference", label: "Reference", value: (row) => row.reference },
        { key: "sender", label: "Sender number", value: (row) => row.sender },
        { key: "status", label: "Status", value: (row) => row.status },
        { key: "verifiedBy", label: "Verified by", value: (row) => row.verifiedBy },
        { key: "date", label: "Date", value: (row) => row.date },
      ],
    );
  }

  if (type === "products" || type === "inventory") {
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    await audit({
      actor: admin,
      action: `export.${type}`,
      entity: "Product",
      meta: { count: products.length },
    });
    return csvResponse(
      `buyzen-${type}-${Date.now()}.csv`,
      products.map((product) => ({
        name: product.name,
        sku: product.sku,
        category: product.category.name,
        price: (product.price / 100).toFixed(2),
        cost: ((product.cost ?? 0) / 100).toFixed(2),
        stock: product.stock,
        threshold: product.lowStockThreshold,
        value: ((product.stock * product.price) / 100).toFixed(2),
        rating: product.rating,
        reviews: product.reviewCount,
      })),
      [
        { key: "name", label: "Product", value: (row) => row.name },
        { key: "sku", label: "SKU", value: (row) => row.sku },
        { key: "category", label: "Category", value: (row) => row.category },
        { key: "price", label: "Price", value: (row) => row.price },
        { key: "cost", label: "Cost", value: (row) => row.cost },
        { key: "stock", label: "Stock", value: (row) => row.stock },
        {
          key: "threshold",
          label: "Low stock threshold",
          value: (row) => row.threshold,
        },
        {
          key: "value",
          label: "Stock value",
          value: (row) => row.value,
        },
        { key: "rating", label: "Rating", value: (row) => row.rating },
        { key: "reviews", label: "Review count", value: (row) => row.reviews },
      ],
    );
  }

  if (type === "reviews") {
    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return csvResponse(
      `buyzen-reviews-${Date.now()}.csv`,
      reviews.map((review) => ({
        product: review.product.name,
        customer: review.user.name,
        email: review.user.email,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: review.status,
        reported: review.reported ? "yes" : "no",
        date: review.createdAt.toISOString(),
      })),
      [
        { key: "product", label: "Product", value: (row) => row.product },
        { key: "customer", label: "Customer", value: (row) => row.customer },
        { key: "email", label: "Email", value: (row) => row.email },
        { key: "rating", label: "Rating", value: (row) => row.rating },
        { key: "title", label: "Title", value: (row) => row.title },
        { key: "body", label: "Review", value: (row) => row.body },
        { key: "status", label: "Status", value: (row) => row.status },
        { key: "reported", label: "Reported", value: (row) => row.reported },
        { key: "date", label: "Date", value: (row) => row.date },
      ],
    );
  }

  if (type === "coupons") {
    const coupons = await prisma.coupon.findMany({
      include: { customer: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return csvResponse(
      `buyzen-coupons-${Date.now()}.csv`,
      coupons.map((coupon) => ({
        code: coupon.code,
        type: coupon.type,
        value:
          coupon.type === "FIXED"
            ? (coupon.value / 100).toFixed(2)
            : String(coupon.value),
        minSubtotal: (coupon.minSubtotal / 100).toFixed(2),
        used: coupon.usedCount,
        active: coupon.active ? "yes" : "no",
        audience: coupon.customer?.email ?? "everyone",
        expires: coupon.expiresAt?.toISOString() ?? "",
      })),
      [
        { key: "code", label: "Code", value: (row) => row.code },
        { key: "type", label: "Type", value: (row) => row.type },
        { key: "value", label: "Value", value: (row) => row.value },
        { key: "minSubtotal", label: "Min order", value: (row) => row.minSubtotal },
        { key: "used", label: "Used", value: (row) => row.used },
        { key: "active", label: "Active", value: (row) => row.active },
        { key: "audience", label: "Audience", value: (row) => row.audience },
        { key: "expires", label: "Expires", value: (row) => row.expires },
      ],
    );
  }

  if (type === "refunds") {
    const refunds = await prisma.refundRequest.findMany({
      include: { order: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
    });
    return csvResponse(
      `buyzen-refunds-${Date.now()}.csv`,
      refunds.map((refund) => ({
        order: refund.order.number,
        amount: (refund.amount / 100).toFixed(2),
        reason: refund.reason,
        status: refund.status,
        resolvedBy: refund.resolvedBy ?? "",
        date: refund.createdAt.toISOString(),
      })),
      [
        { key: "order", label: "Order", value: (row) => row.order },
        { key: "amount", label: "Amount", value: (row) => row.amount },
        { key: "reason", label: "Reason", value: (row) => row.reason },
        { key: "status", label: "Status", value: (row) => row.status },
        {
          key: "resolvedBy",
          label: "Resolved by",
          value: (row) => row.resolvedBy,
        },
        { key: "date", label: "Date", value: (row) => row.date },
      ],
    );
  }

  if (type === "revenue") {
    const orders = await prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        createdAt: true,
        total: true,
        district: true,
        division: true,
        city: true,
        paymentMethod: true,
      },
    });
    const byDistrict = new Map<string, number>();
    for (const order of orders) {
      const key = order.district ?? "Unknown";
      byDistrict.set(key, (byDistrict.get(key) ?? 0) + order.total);
    }
    return csvResponse(
      `buyzen-geographic-sales-${Date.now()}.csv`,
      [...byDistrict.entries()].map(([district, revenue]) => ({
        district,
        revenue: (revenue / 100).toFixed(2),
      })),
      [
        { key: "district", label: "District", value: (row) => row.district },
        {
          key: "revenue",
          label: "Revenue (USD)",
          value: (row) => row.revenue,
        },
      ],
    );
  }

  return NextResponse.json({ error: "Unsupported export" }, { status: 400 });
}
