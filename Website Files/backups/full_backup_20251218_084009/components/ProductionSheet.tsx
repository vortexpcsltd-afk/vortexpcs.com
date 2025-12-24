import React, { useRef } from "react";
import {
  NormalizedOrder,
  normalizeOrder,
  NormalizedItem,
} from "../services/normalizers/orderNormalizer";
import { Order } from "../services/database";

interface ProductionSheetProps {
  order: Order | NormalizedOrder;
}

export const ProductionSheet: React.FC<ProductionSheetProps> = ({
  order: rawOrder,
}) => {
  const order: NormalizedOrder =
    "displayId" in rawOrder ? rawOrder : normalizeOrder(rawOrder);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const printSheet = () => {
    const node = sheetRef.current;
    if (!node) {
      alert("Sheet content not ready yet.");
      return;
    }
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    const printableHTML = clone.innerHTML;
    const styleBlocks = Array.from(
      document.querySelectorAll('style,link[rel="stylesheet"]')
    )
      .map((el) => el.outerHTML)
      .join("");
    const htmlDoc = `<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Production Sheet - ${order.displayId}</title>${styleBlocks}
    <style>@media print{.no-print{display:none!important}}body{background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Fira Sans','Droid Sans','Helvetica Neue',Arial,sans-serif;margin:0;padding:0;} .sheet-wrapper{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;box-shadow:0 8px 24px -6px rgba(0,0,0,0.5);padding:20px;max-width:190mm;margin:0 auto;} table th{background:linear-gradient(to right,#0ea5e9,#2563eb);color:#fff;} table td,table th{font-size:12px;} footer{margin-top:14mm;font-size:11px;opacity:.85;} </style>
    <script>window.onload=function(){setTimeout(function(){window.print();},200);};window.onafterprint=function(){try{window.close();}catch(e){}};</script>
    </head><body><div class='sheet-wrapper'>${printableHTML}</div><footer><img src='/vortexpcs-logo-dark.png' alt='Vortex PCs' style='height:34px;object-fit:contain;display:block;margin:5mm auto 3mm;' onerror="this.style.display='none'"/>Vortex PCs Ltd - Custom PCs Built to Order<br/>This sheet accompanies the completed system for warranty records</footer></body></html>`;

    let w: Window | null = null;
    try {
      w = window.open("", "productionSheetPrint", "width=900,height=1100");
    } catch (e) {
      console.error("Print window blocked", e);
    }
    if (w) {
      try {
        w.document.open();
        w.document.write(htmlDoc);
        w.document.close();
      } catch (e) {
        console.error("Write to print window failed", e);
      }
      return;
    }
    // Fallback: iframe
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (idoc) {
        idoc.open();
        idoc.write(htmlDoc);
        idoc.close();
        setTimeout(() => iframe.contentWindow?.print(), 250);
      }
    } catch {
      alert("Unable to open print view. Popup blocker may be active.");
    }
  };

  const exportCSV = () => {
    const lines: string[] = [];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    lines.push("Order Metadata");
    lines.push(
      [
        esc("Display ID"),
        esc("Customer Name"),
        esc("Email"),
        esc("Status"),
        esc("Order Date"),
        esc("Estimated Completion"),
        esc("Payment Method"),
        esc("Total (£)"),
        esc("Shipping Method"),
        esc("Shipping Cost (£)"),
        esc("Updated At"),
      ].join(",")
    );
    lines.push(
      [
        esc(order.displayId),
        esc(
          (order.original as Order & { customerName?: string })?.customerName ||
            ""
        ),
        esc(
          (order.original as Order & { customerEmail?: string })
            ?.customerEmail || ""
        ),
        esc(order.status),
        esc(order.orderDate ? new Date(order.orderDate).toISOString() : ""),
        esc(
          order.estimatedCompletion
            ? new Date(order.estimatedCompletion).toISOString()
            : ""
        ),
        esc(order.paymentMethod || ""),
        esc(order.total.toFixed(2)),
        esc(order.shippingMethod || ""),
        esc(
          typeof order.shippingCost === "number"
            ? order.shippingCost.toFixed(2)
            : ""
        ),
        esc(order.updatedAt ? new Date(order.updatedAt).toISOString() : ""),
      ].join(",")
    );
    lines.push("");
    lines.push("Items");
    lines.push(
      ["Component", "Category", "Qty", "Unit Price (£)", "Line Total (£)"]
        .map(esc)
        .join(",")
    );
    order.items.forEach((i) => {
      const unitPrice = i.quantity ? i.lineTotal / i.quantity : i.lineTotal;
      lines.push(
        [
          esc(i.name),
          esc(i.category || ""),
          esc(i.quantity),
          esc(unitPrice.toFixed(2)),
          esc(i.lineTotal.toFixed(2)),
        ].join(",")
      );
    });
    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-sheet-${order.displayId}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const left = 14;
      const right = 196;
      let y = 20;

      // Header with logo placeholder and title
      doc.setFillColor(14, 165, 233); // Sky blue
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("VORTEX PCS", left, 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Production Sheet", right - 40, 10);

      y = 22;
      doc.setTextColor(0, 0, 0);

      // Order ID and Date
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Order #${order.displayId}`, left, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dateStr = order.orderDate
        ? new Date(order.orderDate).toLocaleDateString("en-GB")
        : "N/A";
      doc.text(dateStr, right - doc.getTextWidth(dateStr), y);
      y += 10;

      // Customer Section
      doc.setFillColor(240, 240, 240);
      doc.rect(left - 2, y - 5, right - left + 4, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CUSTOMER INFORMATION", left, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Name: ${
          (order.original as Order & { customerName?: string })?.customerName ||
          "N/A"
        }`,
        left,
        y
      );
      y += 5;
      doc.text(
        `Email: ${
          (order.original as Order & { customerEmail?: string })
            ?.customerEmail || "N/A"
        }`,
        left,
        y
      );
      y += 5;
      const addr = order.address || order.original?.address;
      if (addr) {
        doc.text(
          `Address: ${addr.line1 || ""}${
            addr.line2 ? ", " + addr.line2 : ""
          }, ${addr.city || ""}, ${addr.postcode || ""}, ${addr.country || ""}`,
          left,
          y,
          { maxWidth: right - left - 10 }
        );
        y += 10;
      } else {
        y += 5;
      }

      // Order Details Section
      doc.setFillColor(240, 240, 240);
      doc.rect(left - 2, y - 5, right - left + 4, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ORDER DETAILS", left, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${order.status.toUpperCase()}`, left, y);
      doc.text(`Payment: ${order.paymentMethod || "N/A"}`, left + 60, y);
      y += 5;
      doc.text(`Total: £${order.total.toFixed(2)}`, left, y);
      doc.text(`Shipping: ${order.shippingMethod || "N/A"}`, left + 60, y);
      y += 10;

      // Notes
      const notes =
        order.notes ||
        (order.original as Order & { notes?: string })?.notes ||
        "";
      if (notes) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", left, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const splitNotes = doc.splitTextToSize(notes, right - left - 10);
        doc.text(splitNotes, left, y);
        y += splitNotes.length * 4 + 5;
      }

      // Components Section
      doc.setFillColor(240, 240, 240);
      doc.rect(left - 2, y - 5, right - left + 4, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("COMPONENTS", left, y);
      y += 8;

      // Table header
      doc.setFillColor(14, 165, 233);
      doc.rect(left, y - 4, right - left, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Component", left + 2, y);
      doc.text("Category", left + 95, y);
      doc.text("Qty", left + 130, y);
      doc.text("Price", left + 145, y);
      y += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Table rows
      order.items.forEach((i, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternate row colors
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(left, y - 4, right - left, 6, "F");
        }

        doc.setFontSize(8);
        const componentText =
          i.name.length > 50 ? i.name.slice(0, 47) + "..." : i.name;
        doc.text(componentText, left + 2, y);
        doc.text((i.category || "").slice(0, 15), left + 95, y);
        doc.text(String(i.quantity), left + 130, y);
        doc.text(`£${i.lineTotal.toFixed(2)}`, left + 145, y);
        y += 6;
      });

      // Total
      y += 2;
      doc.setDrawColor(0);
      doc.line(left + 130, y - 2, right - 2, y - 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL:", left + 95, y + 2);
      doc.text(`£${order.total.toFixed(2)}`, left + 145, y + 2);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated by Vortex PCs Production System - Page ${i} of ${pageCount}`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(`production-sheet-${order.displayId}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("PDF export failed. See console for details.");
    }
  };

  return (
    <>
      <div
        id="production-sheet-root"
        ref={sheetRef}
        className="production-sheet bg-white text-black p-8 max-w-[210mm] mx-auto"
      >
        {/* Header with logo and metadata */}
        <div className="border-b-4 border-sky-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col items-start">
              <img
                src="/vortexpcs-logo-dark.png"
                alt="Vortex PCs Logo"
                className="w-32 h-auto object-contain mb-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/vortexpcs-logo.png";
                }}
              />
              <p className="text-base text-gray-600 font-semibold">
                Order Completion & QA Checklist
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold">#{order.displayId}</div>
              <div className="text-sm text-gray-600">
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString("en-GB")
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-500">
                Serial:&nbsp;
                {(order.original as Order & { serialNumber?: string })
                  ?.serialNumber || "TBD"}
              </div>
              <div className="text-xs text-gray-500">
                Build Tech:&nbsp;
                {(order.original as Order & { buildTechnician?: string })
                  ?.buildTechnician || "TBD"}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            CUSTOMER INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-4 px-3">
            <div>
              <p className="text-sm font-semibold">Name:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.original?.customerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Email:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.original?.customerEmail || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold">Delivery Address:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.address
                  ? `${order.address.line1 || ""}${
                      order.address.line2 ? ", " + order.address.line2 : ""
                    }, ${order.address.city || ""}, ${
                      order.address.postcode || ""
                    }, ${order.address.country || ""}`
                  : order.original?.address
                  ? `${order.original.address.line1 || ""}${
                      order.original.address.line2
                        ? ", " + order.original.address.line2
                        : ""
                    }, ${order.original.address.city || ""}, ${
                      order.original.address.postcode || ""
                    }, ${order.original.address.country || ""}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            ORDER DETAILS
          </h2>
          <div className="grid grid-cols-2 gap-4 px-3 mb-4">
            <div>
              <p className="text-sm font-semibold">Order Status:</p>
              <p className="text-base border-b border-gray-300 pb-1 uppercase">
                {order.status}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Payment Method:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.paymentMethod || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Estimated Completion:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.estimatedCompletion
                  ? new Date(order.estimatedCompletion).toLocaleDateString(
                      "en-GB"
                    )
                  : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Total Value:</p>
              <p className="text-base border-b border-gray-300 pb-1 font-bold">
                £{order.total.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Shipping Method:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.shippingMethod || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Shipping Cost:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {typeof order.shippingCost === "number"
                  ? `£${order.shippingCost.toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Updated At:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.updatedAt
                  ? new Date(order.updatedAt).toLocaleDateString("en-GB")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Notes:</p>
              <p className="text-base border-b border-gray-300 pb-1">
                {order.notes ||
                  (order.original as Order & { notes?: string })?.notes ||
                  "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Components Checklist */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            COMPONENTS CHECKLIST
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-2 text-left text-sm w-12">
                  ✓
                </th>
                <th className="border border-gray-400 px-2 py-2 text-left text-sm">
                  Component
                </th>
                <th className="border border-gray-400 px-2 py-2 text-center text-sm w-16">
                  Qty
                </th>
                <th className="border border-gray-400 px-2 py-2 text-right text-sm w-24">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: NormalizedItem, index: number) => (
                <tr key={index}>
                  <td className="border border-gray-400 px-2 py-3 text-center">
                    <div className="w-5 h-5 border-2 border-gray-400 mx-auto"></div>
                  </td>
                  <td className="border border-gray-400 px-2 py-2 text-sm">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {item.category && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-600">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-400 px-2 py-2 text-center text-sm">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-400 px-2 py-2 text-right text-sm">
                    £{item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Build Process Checklist */}
        <div className="mb-6 page-break">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            BUILD PROCESS CHECKLIST
          </h2>
          <div className="space-y-2 px-3">
            {[
              "Install CPU and apply thermal paste",
              "Install CPU cooler and verify mounting",
              "Install RAM modules in correct slots",
              "Mount motherboard in case with standoffs",
              "Install PSU and route power cables",
              "Install storage drives (M.2/SSD/HDD)",
              "Install GPU and secure with bracket",
              "Connect all power cables (24-pin, 8-pin CPU, PCIe)",
              "Connect front panel headers (power, reset, USB, audio)",
              "Install case fans and connect to headers/hub",
              "Cable management and tie down",
              "Install RGB/lighting components",
            ].map((step, index) => (
              <div key={index} className="flex items-start space-x-3 py-1">
                <div className="w-5 h-5 border-2 border-gray-400 mt-0.5 flex-shrink-0"></div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Control & Testing */}
        <div className="mb-6 page-break">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            QUALITY CONTROL & TESTING
          </h2>
          <div className="space-y-2 px-3">
            {[
              "POST test - System powers on and displays BIOS",
              "RAM detection - All modules recognised at correct speed",
              "Storage detection - All drives visible in BIOS",
              "GPU detection - Graphics card recognised",
              "BIOS configuration - XMP/DOCP enabled, boot order set",
              "Windows installation - OS installed and activated",
              "Driver installation - Chipset, GPU, audio drivers",
              "Stress test - CPU (15 min) and GPU (15 min)",
              "Temperature check - All components within spec",
              "RGB/lighting test - All effects working",
              "Colour calibration - Display output validated (if applicable)",
              "Port functionality - USB, audio, network tested",
              "Final visual inspection - Cable routing, no damage",
            ].map((step, index) => (
              <div key={index} className="flex items-start space-x-3 py-1">
                <div className="w-5 h-5 border-2 border-gray-400 mt-0.5 flex-shrink-0"></div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-200 px-3 py-2 mb-3">
            TECHNICIAN NOTES
          </h2>
          <div className="border-2 border-gray-300 min-h-[100px] p-3 text-sm">
            {order.notes ||
              (order.original as Order & { notes?: string })?.notes ||
              ""}
          </div>
        </div>

        {/* Sign Off */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-sm font-semibold mb-2">Built By:</p>
            <div className="border-b-2 border-gray-400 pb-1 mb-1"></div>
            <p className="text-xs text-gray-600">Name</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Date Completed:</p>
            <div className="border-b-2 border-gray-400 pb-1 mb-1"></div>
            <p className="text-xs text-gray-600">DD/MM/YYYY</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">QC Checked By:</p>
            <div className="border-b-2 border-gray-400 pb-1 mb-1"></div>
            <p className="text-xs text-gray-600">Name</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">QC Date:</p>
            <div className="border-b-2 border-gray-400 pb-1 mb-1"></div>
            <p className="text-xs text-gray-600">DD/MM/YYYY</p>
          </div>
        </div>

        {/* Footer (screen only, print has its own footer) */}
        <div className="border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-600 no-print">
          <p>Vortex PCs Ltd - Custom PCs Built to Order</p>
          <p className="mt-1">
            This sheet accompanies the completed system for warranty records
          </p>
        </div>

        {/* Print Button - Only visible on screen */}
        <div className="no-print mt-8 text-center">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={printSheet}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              🖨️ Print
            </button>
            <button
              onClick={exportPDF}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              📄 Download PDF
            </button>
            <button
              onClick={exportCSV}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              📊 Download CSV
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductionSheet;
