/**
 * Email Service
 * Handles sending emails for contact forms, order confirmations, and business notifications
 */

import nodemailer from "nodemailer";

// Email configuration function (called at runtime)
const getEmailConfig = () => ({
  host:
    (import.meta as any).env?.VITE_SMTP_HOST ||
    process.env.VITE_SMTP_HOST ||
    "smtp.gmail.com",
  port: parseInt(
    (import.meta as any).env?.VITE_SMTP_PORT ||
      process.env.VITE_SMTP_PORT ||
      "587"
  ),
  secure:
    ((import.meta as any).env?.VITE_SMTP_SECURE ||
      process.env.VITE_SMTP_SECURE) === "true", // true for 465, false for other ports
  auth: {
    user:
      (import.meta as any).env?.VITE_SMTP_USER || process.env.VITE_SMTP_USER, // SMTP username
    pass:
      (import.meta as any).env?.VITE_SMTP_PASS || process.env.VITE_SMTP_PASS, // SMTP password or app password
  },
});

// Business contact information function (called at runtime)
const getBusinessInfo = () => ({
  name: "Vortex PCs Ltd",
  email:
    (import.meta as any).env?.VITE_BUSINESS_EMAIL ||
    process.env.VITE_BUSINESS_EMAIL ||
    "info@vortexpcs.com",
  phone: "+44 20 1234 5678",
  address: "123 Tech Street, London, UK",
  website: "https://www.vortexpcs.com",
});

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const emailConfig = getEmailConfig();
    // Check if email is configured
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn(
        "Email service not configured. Set VITE_SMTP_USER and VITE_SMTP_PASS environment variables."
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
};

// Email templates
const emailTemplates = {
  contactFormSubmission: (data: ContactFormData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `New Contact Form Submission: ${data.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Contact Form Submission</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #2563eb; }
              .value { background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
                <p>You have received a new message from your website.</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${data.name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${data.email}</div>
                </div>
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value">${data.phone || "Not provided"}</div>
                </div>
                <div class="field">
                  <div class="label">Enquiry Type:</div>
                  <div class="value">${data.enquiryType}</div>
                </div>
                <div class="field">
                  <div class="label">Subject:</div>
                  <div class="value">${data.subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value">${data.message.replace(
                    /\n/g,
                    "<br>"
                  )}</div>
                </div>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  This message was sent from the contact form on ${
                    businessInfo.website
                  }
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  contactFormAutoReply: (data: ContactFormData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: "Thank you for contacting Vortex PCs",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Thank you for contacting Vortex PCs</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You for Contacting Vortex PCs</h1>
              </div>
              <div class="content">
                <p>Dear ${data.name},</p>

                <p>Thank you for reaching out to Vortex PCs. We have received your message and appreciate you taking the time to contact us.</p>

                <div class="highlight">
                  <strong>Your enquiry details:</strong><br>
                  Subject: ${data.subject}<br>
                  Enquiry Type: ${data.enquiryType}
                </div>

                <p>Our team will review your message and get back to you within 24 hours during business hours (Monday-Friday, 9AM-6PM GMT).</p>

                <p>If your enquiry is urgent, please don't hesitate to call us directly on ${businessInfo.phone}.</p>

                <p>Best regards,<br>
                The Vortex PCs Team<br>
                ${businessInfo.email}<br>
                ${businessInfo.phone}</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                  ${businessInfo.name} | ${businessInfo.address} | ${businessInfo.website}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  orderConfirmation: (orderData: OrderData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `Order Confirmation - Order #${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .order-details { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
              .total { font-size: 18px; font-weight: bold; color: #059669; }
              .status { color: #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Order Confirmation</h1>
                <p>Thank you for your purchase!</p>
              </div>
              <div class="content">
                <p>Dear ${orderData.customerName},</p>

                <p>Thank you for choosing Vortex PCs! Your order has been successfully processed and confirmed.</p>

                <div class="order-details">
                  <h3>Order Details</h3>
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Order Date:</strong> ${new Date(
                    orderData.orderDate
                  ).toLocaleDateString()}</p>
                  <p><strong>Payment Status:</strong> <span class="status">${
                    orderData.paymentStatus
                  }</span></p>
                  <p><strong>Total Amount:</strong> <span class="total">£${orderData.totalAmount.toFixed(
                    2
                  )}</span></p>
                </div>

                <h4>Items Ordered:</h4>
                <ul>
                  ${orderData.items
                    .map(
                      (item) =>
                        `<li>${item.name} × ${item.quantity} - £${(
                          item.price * item.quantity
                        ).toFixed(2)}</li>`
                    )
                    .join("")}
                </ul>

                <h4>Shipping Address:</h4>
                <p>
                  ${orderData.shippingAddress.line1}<br>
                  ${orderData.shippingAddress.city}<br>
                  ${orderData.shippingAddress.postal_code}<br>
                  ${orderData.shippingAddress.country}
                </p>

                <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4>What happens next?</h4>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Your order is being prepared for building</li>
                    <li>You'll receive tracking information once your PC is dispatched</li>
                    <li>Estimated delivery: 5-7 business days</li>
                    <li>Questions? Contact us at ${businessInfo.email} or ${
        businessInfo.phone
      }</li>
                  </ul>
                </div>

                <p>If you have any questions about your order, please don't hesitate to contact us.</p>

                <p>Best regards,<br>
                The Vortex PCs Team<br>
                ${businessInfo.email}<br>
                ${businessInfo.phone}</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                  ${businessInfo.name} | ${businessInfo.address} | ${
        businessInfo.website
      }
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  orderNotification: (orderData: OrderData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `🚨 NEW ORDER RECEIVED - £${orderData.totalAmount.toFixed(
        2
      )} - ${orderData.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Order Received</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .urgent { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
              .total { font-size: 24px; font-weight: bold; color: #d97706; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 NEW ORDER RECEIVED</h1>
                <p>A new order has been placed and paid for!</p>
              </div>
              <div class="content">
                <div class="urgent">
                  <h2>Order Summary</h2>
                  <p class="total">Total: £${orderData.totalAmount.toFixed(
                    2
                  )}</p>
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Customer:</strong> ${orderData.customerName}</p>
                  <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                  <p><strong>Order Date:</strong> ${new Date(
                    orderData.orderDate
                  ).toLocaleString()}</p>
                </div>

                <h3>Items Ordered:</h3>
                <ul>
                  ${orderData.items
                    .map(
                      (item) =>
                        `<li>${item.name} × ${item.quantity} - £${(
                          item.price * item.quantity
                        ).toFixed(2)}</li>`
                    )
                    .join("")}
                </ul>

                <h3>Shipping Address:</h3>
                <p>
                  ${orderData.shippingAddress.line1}<br>
                  ${orderData.shippingAddress.city}<br>
                  ${orderData.shippingAddress.postal_code}<br>
                  ${orderData.shippingAddress.country}
                </p>

                <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4>Action Required:</h4>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Process the order in your order management system</li>
                    <li>Send build confirmation to customer</li>
                    <li>Update inventory if necessary</li>
                    <li>Prepare for fulfillment</li>
                  </ul>
                </div>

                <p style="color: #dc2626; font-weight: bold;">
                  This is an automated notification. Please check your order management system for full details.
                </p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                  ${businessInfo.name} Order Management System
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
};

// Types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  enquiryType: string;
  message: string;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  orderDate: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

/**
 * Send contact form email
 */
export const sendContactFormEmail = async (
  data: ContactFormData
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    // Send email to business
    const businessEmail = emailTemplates.contactFormSubmission(data);
    await transporter.sendMail({
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: businessInfo.email,
      subject: businessEmail.subject,
      html: businessEmail.html,
    });

    // Send auto-reply to customer
    const autoReply = emailTemplates.contactFormAutoReply(data);
    await transporter.sendMail({
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: data.email,
      subject: autoReply.subject,
      html: autoReply.html,
    });

    console.log("✅ Contact form emails sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to send contact form emails:", error);
    return false;
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  orderData: OrderData
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    const emailTemplate = emailTemplates.orderConfirmation(orderData);
    await transporter.sendMail({
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: orderData.customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("✅ Order confirmation email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to send order confirmation email:", error);
    return false;
  }
};

/**
 * Send order notification to business
 */
export const sendOrderNotificationEmail = async (
  orderData: OrderData,
  businessEmail?: string
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    const emailTemplate = emailTemplates.orderNotification(orderData);
    await transporter.sendMail({
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: businessEmail || businessInfo.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("✅ Order notification email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to send order notification email:", error);
    return false;
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async (): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error);
    return false;
  }
};

export default {
  sendContactFormEmail,
  sendOrderConfirmationEmail,
  sendOrderNotificationEmail,
  testEmailConfiguration,
};
