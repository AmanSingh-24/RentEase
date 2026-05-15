import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (payment: any, property: any, tenantName: string) => {
  const doc = new jsPDF();
  
  // Design Header
  doc.setFillColor(31, 41, 55); // Dark Slate
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("RENTEASE AUDIT RECEIPT", 15, 25);
  
  // Property Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`PROPERTY: ${property.address}`, 15, 50);
  doc.text(`TENANT: ${tenantName}`, 15, 55);
  doc.text(`TRANSACTION ID: ${payment.gatewayTransactionId || "N/A"}`, 15, 60);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 160, 50);

  // Financial Table
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Month', 'Amount']],
    body: [
      ['Base Monthly Rent', payment.month, `INR ${payment.baseRent || property.rentAmount}`],
      ['Maintenance Credits', 'Deduction', `- INR ${payment.maintenanceCredit || 0}`],
      ['Late Fee Penalty', 'Protocol', `+ INR ${payment.penaltyApplied || 0}`],
      [{ content: 'TOTAL PAID', styles: { fontStyle: 'bold' } }, '', { content: `INR ${payment.totalAmountPaid || payment.amount}`, styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped',
    headStyles: { fillColor: [31, 41, 55] }
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a system-generated audit report secured by RentEase Vault.", 15, doc.internal.pageSize.height - 10);

  doc.save(`Receipt_${payment.month}_${tenantName}.pdf`);
};