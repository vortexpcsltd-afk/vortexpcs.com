/**
 * Price Alert UI Component - Debug Version
 */

import React from "react";
import { PCBuilderComponent } from "../PCBuilder";

interface PriceAlertComponentProps {
  component: PCBuilderComponent;
  userEmail?: string;
}

export const PriceAlertComponent: React.FC<PriceAlertComponentProps> = ({
  component,
  userEmail,
}) => {
  return (
    <div
      style={{
        width: "100%",
        padding: "20px",
        marginTop: "24px",
        marginBottom: "24px",
        backgroundColor: "#FF0000",
        border: "4px solid #FFFF00",
        borderRadius: "12px",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        textAlign: "center",
        zIndex: 9999,
        position: "relative",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "12px" }}>
        🔔 PRICE ALERT SECTION
      </div>
      <div style={{ fontSize: "14px" }}>Component: {component.name}</div>
      <div style={{ fontSize: "14px", marginTop: "8px" }}>
        User Email: {userEmail ? "✓ " + userEmail : "❌ NOT LOGGED IN"}
      </div>
      <button
        onClick={() => alert("Price alert clicked!")}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          backgroundColor: "#0099FF",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Test Button
      </button>
    </div>
  );
};
