/**
 * Business order endpoint (Add to cart)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "POST",
  async (req: VercelRequest, res: VercelResponse) => {
    try {
      const {
        companyName,
        companyRegistration,
        vatNumber,
        postcode,
        contactName,
        contactEmail,
        contactPhone,
        os,
        quantity = 1,
        workstation,
      } = req.body || {};

      console.log("Business order request received:", {
        companyName,
        postcode,
        contactName,
        contactEmail,
        contactPhone,
        workstation: workstation?.name,
        quantity,
      });

      // Validate required fields
      if (
        !companyName ||
        !postcode ||
        !contactName ||
        !contactEmail ||
        !contactPhone ||
        !workstation?.name
      ) {
        console.warn("Business order missing required fields", {
          hasCompanyName: Boolean(companyName),
          hasPostcode: Boolean(postcode),
          hasContactName: Boolean(contactName),
          hasContactEmail: Boolean(contactEmail),
          hasContactPhone: Boolean(contactPhone),
          hasWorkstation: Boolean(workstation?.name),
        });
        return res.status(400).json({
          success: false,
          message: "Invalid request - missing required fields",
        });
      }

      // In a real implementation, you would:
      // 1. Create a cart session for the customer
      // 2. Store the order details in the database
      // 3. Send a confirmation email to the customer
      // 4. Redirect to checkout or send back a cart token

      // For now, we'll just acknowledge the order
      const orderData = {
        companyName,
        companyRegistration,
        vatNumber,
        postcode,
        contactName,
        contactEmail,
        contactPhone,
        os,
        quantity,
        workstation: {
          id: workstation.id,
          name: workstation.name,
          price: workstation.price,
          totalPrice: (workstation.price || 0) * quantity,
        },
        orderType: "direct",
        timestamp: new Date().toISOString(),
      };

      console.log("Business order received:", {
        company: companyName,
        workstation: workstation.name,
        quantity,
        totalValue: (workstation.price || 0) * quantity,
      });

      // Success response
      return res.status(200).json({
        success: true,
        message: "Order added to cart successfully",
        orderData,
      });
    } catch (error) {
      console.error("Business order error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process order",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
