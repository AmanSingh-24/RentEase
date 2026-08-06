// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_fallback_key");
const FROM_EMAIL = process.env.EMAIL_FROM || "RentEase <onboarding@resend.dev>";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rentease-five-teal.vercel.app";

// ── Common Email Wrapper Template ─────────────────────────────────────────────
function wrapTemplate(title: string, badge: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #0f172a; text-align: left;">
                    <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px;">
                      RentEase
                    </div>
                    <div style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.1); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">
                      ${badge}
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
                    <p style="margin: 0 0 8px 0; font-weight: 600;">RentEase Inc. · India's Trusted Digital Rental Platform</p>
                    <p style="margin: 0;">This is an automated operational notification regarding your RentEase account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// TENANT EMAIL NOTIFICATIONS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * 1. TENANT: Property Assigned (Booking Request Approved by Owner)
 */
export async function sendTenantPropertyAssignedEmail(toEmail: string, tenantName: string, propertyAddress: string) {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">🎉 Great News, ${tenantName}!</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      The landlord has reviewed and <strong style="color: #0f172a;">APPROVED</strong> your booking request for the property at:
    </p>

    <div style="padding: 20px; background-color: #f8fafc; border-left: 4px solid #0052cc; border-radius: 12px; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${propertyAddress}</p>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
      To lock in your tenancy, please complete Step 1 (Security Deposit & 1st Month Rent) and Step 2 (Digital Lease Signature) from your dashboard.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/login" style="display: inline-block; padding: 16px 36px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
        Complete Payment & Sign Lease →
      </a>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `🎉 Booking Approved for ${propertyAddress} — Complete Your Onboarding`,
      html: wrapTemplate("Booking Approved", "Property Assigned", content),
    });
  } catch (error) {
    console.error("EMAIL_ERROR [sendTenantPropertyAssignedEmail]:", error);
  }
}

/**
 * 2. TENANT: Booking Request Rejected by Owner
 */
export async function sendTenantBookingRejectedEmail(toEmail: string, tenantName: string, propertyAddress: string) {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Booking Update</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      Hello ${tenantName}, the landlord has reviewed your booking request for <strong>${propertyAddress}</strong> and is unable to proceed at this time.
    </p>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
      Don't worry! Explore our marketplace for dozens of other verified properties matching your requirements.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/properties" style="display: inline-block; padding: 16px 36px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px;">
        Explore Marketplace Properties →
      </a>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Update on your booking request for ${propertyAddress}`,
      html: wrapTemplate("Booking Update", "Application Status", content),
    });
  } catch (error) {
    console.error("EMAIL_ERROR [sendTenantBookingRejectedEmail]:", error);
  }
}

/**
 * 3. TENANT: Onboarding Verified & Tenancy Dashboard Activated
 */
export async function sendTenantFinalApprovalEmail(toEmail: string, tenantName: string, propertyAddress: string) {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">🏠 Welcome Home, ${tenantName}!</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      The landlord has verified your payment receipt and co-signed your lease agreement for:
    </p>

    <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 12px; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #14532d;">${propertyAddress}</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d; font-weight: 600;">Status: Tenancy Active & Verified</p>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
      Your full <strong>Tenant Dashboard</strong> is now active. Please log in and complete your initial <strong>Digital Witness Move-in Inspection</strong> before moving in.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/login" style="display: inline-block; padding: 16px 36px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px;">
        Access Tenant Dashboard →
      </a>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `🏠 Tenancy Activated! Welcome to ${propertyAddress}`,
      html: wrapTemplate("Tenancy Active", "Verified Tenant", content),
    });
  } catch (error) {
    console.error("EMAIL_ERROR [sendTenantFinalApprovalEmail]:", error);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// OWNER EMAIL NOTIFICATIONS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * 4. OWNER: Onboarding Form Submitted (Awaiting Admin Review 24-48h)
 */
export async function sendOwnerOnboardingSubmittedEmail(toEmail: string, ownerName: string, propertyAddress: string) {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Application Received, ${ownerName}!</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      Thank you for submitting your property listing application for:
    </p>

    <div style="padding: 20px; background-color: #f8fafc; border-left: 4px solid #0f172a; border-radius: 12px; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${propertyAddress}</p>
    </div>

    <div style="padding: 16px; background-color: #eff6ff; border-radius: 12px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
        ⏳ Verification Timeline: Our admin verification team is reviewing your KYC ID and property deed documents. Review takes <strong>24 to 48 hours</strong>.
      </p>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
      We will notify you via email as soon as your listing is approved and goes live on the marketplace.
    </p>
  `;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Listing Application Submitted for ${propertyAddress}`,
      html: wrapTemplate("Application Received", "Under Review", content),
    });
  } catch (error) {
    console.error("EMAIL_ERROR [sendOwnerOnboardingSubmittedEmail]:", error);
  }
}

/**
 * 5. OWNER: Application Approved / Rejected by Admin
 */
export async function sendOwnerApplicationDecisionEmail(
  toEmail: string,
  ownerName: string,
  propertyAddress: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  const isApproved = status === "approved";

  const content = isApproved ? `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">🎉 Congratulations, ${ownerName}!</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      Your host application and property listing for <strong>${propertyAddress}</strong> have been <strong style="color: #16a34a;">APPROVED</strong> by our verification team!
    </p>

    <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 12px; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 15px; font-weight: 700; color: #14532d;">Your listing is now LIVE on the RentEase public marketplace.</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/login" style="display: inline-block; padding: 16px 36px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px;">
        Access Host Dashboard →
      </a>
    </div>
  ` : `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Host Application Status</h1>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      Hello ${ownerName}, our team reviewed your listing application for <strong>${propertyAddress}</strong> and requires additional information before approval.
    </p>

    ${rejectionReason ? `
      <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 12px; margin-bottom: 28px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; color: #991b1b; text-transform: uppercase;">Feedback from Verification Team:</p>
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #7f1d1d;">"${rejectionReason}"</p>
      </div>
    ` : ""}

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
      You can update your document submissions and resubmit anytime from your portal.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/onboarding/landlord" style="display: inline-block; padding: 16px 36px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px;">
        Update & Resubmit Application →
      </a>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: isApproved
        ? `🎉 Property Listing Approved: ${propertyAddress}`
        : `Update on your host application for ${propertyAddress}`,
      html: wrapTemplate(
        isApproved ? "Listing Approved" : "Application Update",
        isApproved ? "Verified Host" : "Action Required",
        content
      ),
    });
  } catch (error) {
    console.error("EMAIL_ERROR [sendOwnerApplicationDecisionEmail]:", error);
  }
}
