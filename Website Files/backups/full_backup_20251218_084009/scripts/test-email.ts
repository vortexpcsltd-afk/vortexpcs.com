/**
 * Email System Test Script
 * Tests email configuration and sends a test order confirmation
 *
 * Usage: npm run ts-node scripts/test-email.ts
 */

import nodemailer from "nodemailer";

// Read environment variables
const getEnv = (key: string) => process.env[key];

const emailConfig = {
  host: getEnv("VITE_SMTP_HOST") || "smtp.gmail.com",
  port: parseInt(getEnv("VITE_SMTP_PORT") || "587"),
  secure: (getEnv("VITE_SMTP_SECURE") || "false") === "true",
  auth: {
    user: getEnv("VITE_SMTP_USER"),
    pass: getEnv("VITE_SMTP_PASS"),
  },
};

const businessInfo = {
  name: "Vortex PCs Ltd",
  email: getEnv("VITE_BUSINESS_EMAIL") || "info@vortexpcs.com",
  phone: "01603 975440",
};

async function testEmail() {
  console.log("📧 Testing Email Configuration\n");
  console.log("=".repeat(60));

  // Check configuration
  console.log("\n🔍 Checking Configuration...");
  console.log(`SMTP Host: ${emailConfig.host}`);
  console.log(`SMTP Port: ${emailConfig.port}`);
  console.log(`SMTP User: ${emailConfig.auth.user || "❌ NOT SET"}`);
  console.log(`SMTP Pass: ${emailConfig.auth.pass ? "✅ SET" : "❌ NOT SET"}`);
  console.log(`Business Email: ${businessInfo.email}`);

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.log("\n❌ Email credentials not configured!");
    console.log("\n💡 Setup Instructions:");
    console.log("1. Set VITE_SMTP_USER to your email address");
    console.log("2. Set VITE_SMTP_PASS to your app-specific password");
    console.log("3. For Gmail, generate app password at:");
    console.log("   https://myaccount.google.com/apppasswords");
    process.exit(1);
  }

  // Create transporter
  console.log("\n🔌 Creating SMTP connection...");
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  });

  // Verify connection
  console.log("🔐 Verifying authentication...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful!");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
    console.log("\n💡 Common Issues:");
    console.log("- Wrong username/password");
    console.log(
      "- Need to enable 'Less secure app access' or use app password"
    );
    console.log("- Firewall blocking SMTP port");
    process.exit(1);
  }

  // Send test email
  console.log("\n📤 Sending test order confirmation email...");

  const testOrder = {
    orderNumber: "TEST-" + Date.now(),
    customerName: "Test Customer",
    customerEmail: emailConfig.auth.user, // Send to yourself
    totalAmount: 1299.99,
    paymentStatus: "Paid",
    orderDate: new Date().toISOString(),
    items: [
      { name: "Intel Core i9-14900K", price: 499.99, quantity: 1 },
      { name: "NVIDIA RTX 4090", price: 1599.99, quantity: 1 },
      { name: "32GB DDR5 RAM", price: 149.99, quantity: 2 },
    ],
    shippingAddress: {
      line1: "123 Test Street",
      city: "London",
      postal_code: "SW1A 1AA",
      country: "UK",
    },
  };

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - TEST</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .total { font-size: 24px; font-weight: bold; color: #059669; }
          .warning { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 TEST Order Confirmation</h1>
            <p>This is a test email from your Vortex PCs checkout system</p>
          </div>
          <div class="content">
            <div class="warning">
              <strong>⚠️ THIS IS A TEST EMAIL</strong><br>
              No actual order was placed. This confirms your email system is working!
            </div>

            <p>Dear ${testOrder.customerName},</p>

            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${testOrder.orderNumber}</p>
            <p><strong>Total Amount:</strong> <span class="total">£${testOrder.totalAmount.toFixed(
              2
            )}</span></p>

            <h4>Items:</h4>
            <ul>
              ${testOrder.items
                .map(
                  (item) =>
                    `<li>${item.name} × ${item.quantity} - £${(
                      item.price * item.quantity
                    ).toFixed(2)}</li>`
                )
                .join("")}
            </ul>

            <p style="color: #059669; font-weight: bold;">
              ✅ Your email system is configured correctly!
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              ${businessInfo.name} | Test Email | ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: testOrder.customerEmail,
      subject: `🧪 TEST Order Confirmation - ${testOrder.orderNumber}`,
      html: emailHtml,
    });

    console.log("✅ Test email sent successfully!");
    console.log(`📬 Check your inbox: ${testOrder.customerEmail}`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Email system is working correctly!\n");
  } catch (error) {
    console.error("❌ Failed to send test email:", error);
    process.exit(1);
  }
}

testEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
