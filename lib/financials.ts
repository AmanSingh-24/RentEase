import Maintenance from "@/models/Maintenance";
import FinancialAdjustment from "@/models/FinancialAdjustment";

export async function calculateLedgerItem(prop: any, tenant: any, monthName: string, year: number, dbPayment: any = null) {
  // If payment is already made and in DB, we just return that (it's sealed)
  if (dbPayment) {
    return {
      _id: dbPayment._id,
      propertyId: prop,
      tenantId: tenant,
      month: dbPayment.month,
      year: dbPayment.year,
      type: "rent",
      status: dbPayment.status || "completed",
      amount: dbPayment.totalAmountPaid,
      breakdown: {
        base: dbPayment.baseRent,
        credit: dbPayment.maintenanceCredit,
        penalty: dbPayment.penaltyApplied
      },
      transactionId: dbPayment.gatewayTransactionId
    };
  }

  // Otherwise, calculate dynamic invoice for this month
  const leaseStart = prop.leaseStartDate ? new Date(prop.leaseStartDate) : null;
  const targetDate = new Date(`${monthName} 1, ${year}`);
  
  if (!leaseStart || targetDate < new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1)) {
    return null; // Before lease started
  }

  // 1. Calculate Base Rent (Prorated exact-days for first month)
  let baseRent = prop.rentAmount;
  let isProrated = false;
  
  if (leaseStart.getMonth() === targetDate.getMonth() && leaseStart.getFullYear() === targetDate.getFullYear()) {
    // It's the first month! Prorate it.
    const daysInMonth = new Date(year, targetDate.getMonth() + 1, 0).getDate();
    const startDay = leaseStart.getDate();
    const activeDays = daysInMonth - startDay + 1;
    
    // Exact days calculation
    const dailyRate = prop.rentAmount / daysInMonth;
    baseRent = Math.round(dailyRate * activeDays);
    isProrated = true;
  }

  // 2. Calculate Maintenance Credits (approved, unpaid credits before this month)
  // For simplicity, we just aggregate any credits that haven't been applied yet.
  const credits = await Maintenance.aggregate([
    { $match: { 
        tenantId: tenant._id, 
        propertyId: prop._id, 
        status: "resolved", 
        isCredited: false,
        isAmountApproved: true,
        isFixedByTenant: true
    }},
    { $group: { 
        _id: null, 
        total: { 
           $sum: { 
               $cond: [
                   { $gt: ["$finalInvoice.amount", 0] },
                   "$finalInvoice.amount",
                   "$estimatedCost"
               ]
           }
        } 
    } }
  ]);
  const maintenanceCredit = credits[0]?.total || 0;

  // 3. Check Financial Adjustments (waivers, custom penalties)
  const adjustment = await FinancialAdjustment.findOne({
    propertyId: prop._id,
    tenantId: tenant._id,
    month: monthName,
    year: year
  });
  
  const isLateFeeWaived = adjustment?.isLateFeeWaived || false;
  
  // 4. Calculate Penalty (if past grace period, usually 5th of month)
  let penaltyApplied = 0;
  const now = new Date();
  
  // If we are looking at a past month, or current month past the 5th
  const gracePeriodEnd = new Date(year, targetDate.getMonth(), 5, 23, 59, 59);
  
  if (now > gracePeriodEnd && !isLateFeeWaived) {
    penaltyApplied = 50; // Flat 50 penalty as requested by owner
  }
  
  // Calculate Final
  const finalAmount = Math.max(0, baseRent - maintenanceCredit + penaltyApplied);
  
  return {
    _id: `inv_${prop._id}_${monthName}_${year}`,
    propertyId: prop,
    tenantId: tenant,
    month: monthName,
    year: year,
    type: "rent",
    status: now > gracePeriodEnd ? "overdue" : "pending",
    amount: finalAmount,
    isProrated,
    breakdown: {
      base: baseRent,
      credit: maintenanceCredit,
      penalty: penaltyApplied,
      isLateFeeWaived
    },
    adjustmentId: adjustment?._id || null
  };
}
