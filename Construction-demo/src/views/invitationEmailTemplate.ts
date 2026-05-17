import branding from "../branding.config";

export interface InvitationEmailTemplateInput {
  packageName: string;
  packageControlNumber: string;
  contractorName?: string;
  sectionNames: string[];
  synopsis: string;
  siteLocation?: string;
  submissionDeadline?: string;
  rfqDate?: string;
  detailsUrl: string;
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhone: string;
  bidId?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function buildInvitationEmailTemplateHtml(
  input: InvitationEmailTemplateInput,
): string {
  const sectionNameListHtml =
    input.sectionNames.length > 0
      ? input.sectionNames.map((name) => `${escapeHtml(name)}`).join(", ")
      : '<li style="margin:0 0 8px 0; color:#64748b; font-size:14px;">Work items will appear here after shortlisting.</li>';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-family:Segoe UI, Tahoma, Arial, sans-serif; background:#f8fafc; color:#0f172a;">
      <tr>
        <td style="padding:32px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; max-width:820px; margin:0 auto; border-collapse:separate; border-spacing:0; background:#ffffff; border:1px solid #cbd5e1; border-radius:14px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:28px 24px; background:linear-gradient(90deg,#0f172a,#1d4ed8); color:#ffffff;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${
                        branding.logoUrl
                          ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.orgName)}" style="height:30px; width:auto; display:block; margin-bottom:6px;"/>`
                          : `<div style="display:inline-block; background:#2563eb; color:#ffffff; font-weight:700; font-size:12px; letter-spacing:0.08em; padding:6px 8px; border-radius:6px; margin-bottom:6px;">${escapeHtml(branding.orgName.slice(0, 3).toUpperCase() || "ORG")}</div>`
                      }
                      <div style="font-size:20px; font-weight:700; line-height:1.2;">${escapeHtml(branding.orgName)}</div>
                      <div style="font-size:12px; color:#bfdbfe; margin-top:2px;">${escapeHtml(branding.orgTagline || "Procurement & Tendering")}</div>
                    </td>
                    <td style="text-align:right; vertical-align:middle;">
                      <div style="font-size:12px; color:#bfdbfe;">Bid Invitation</div>
                      <div style="font-size:13px; font-weight:600; margin-top:3px;">${escapeHtml(input.packageControlNumber || "Package")}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px; background:transparent; border-bottom:1px solid #e2e8f0;">
                <div style="font-size:20px; font-weight:700; color:#0f172a; margin-bottom:16px;">${escapeHtml(input.packageName || "Tender Package")}</div>
                <ul style="margin:0; padding:0 0 0 18px;">${sectionNameListHtml}</ul>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px; background:transparent; border-bottom:1px solid #e2e8f0;">
                <p style="margin:0 0 16px 0; font-size:14px; color:#0f172a; line-height:1.6;">Dear ${input.contractorName ? escapeHtml(input.contractorName) : "Valued Contractor"},</p>
                <p style="margin:0 0 20px 0; font-size:14px; color:#334155; line-height:1.6;">Thank you for your interest in our projects. We are pleased to invite you to submit a bid for the project listed below. Please review the scope of work carefully and confirm your participation before the submission deadline.</p>
                <div style="margin-top:8px;">
                  <a href="mailto:${escapeHtml(input.contactEmail)}?subject=${encodeURIComponent(`Re: ${input.packageName} - ${input.packageControlNumber}`)}" style="display:inline-block; margin-right:8px; background:#ffffff; color:#0e7490; border:1px solid #67e8f9; border-radius:7px; padding:8px 14px; font-size:13px; font-weight:600; text-decoration:none;">Reply</a>
                  <a href="${input.bidId ? `${window.location.origin}/#/tenderpackages/${escapeHtml(input.bidId)}/rfq` : "#"}" style="display:inline-block; margin-right:8px; background:#ffffff; color:#0e7490; border:1px solid #67e8f9; border-radius:7px; padding:8px 14px; font-size:13px; font-weight:600; text-decoration:none;">Raise RFQ</a>
                  <a href="${input.bidId ? `${window.location.origin}/#/tenderpackages/${escapeHtml(input.bidId)}/submission` : "#"}" style="display:inline-block; background:#0e7490; color:#ffffff; border:1px solid #0e7490; border-radius:7px; padding:8px 14px; font-size:13px; font-weight:600; text-decoration:none;">Send Bid</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px; background:transparent; border-bottom:1px solid #e2e8f0;">
                <p style="margin:0 0 16px 0; font-size:14px; color:#334155; line-height:1.6;">Let us know if you are bidding:</p>
                <div style="margin-bottom:16px;">
                  <a href="${input.bidId ? `${window.location.origin}/#/tenderpackages/${escapeHtml(input.bidId)}/bidding` : "#"}" style="display:inline-block; margin:0 6px 6px 0; background:#15803d; color:#ffffff; border-radius:999px; padding:7px 13px; font-size:12px; font-weight:700; text-decoration:none;">Bidding</a>
                  <a href="${input.bidId ? `${window.location.origin}/#/tenderpackages/${escapeHtml(input.bidId)}/notbidding` : "#"}" style="display:inline-block; margin:0 6px 6px 0; background:#b91c1c; color:#ffffff; border-radius:999px; padding:7px 13px; font-size:12px; font-weight:700; text-decoration:none;">Not Bidding</a>
                  <a href="${input.bidId ? `${window.location.origin}/#/tenderpackages/${escapeHtml(input.bidId)}/tentative` : "#"}" style="display:inline-block; margin:0 6px 6px 0; background:#475569; color:#ffffff; border-radius:999px; padding:7px 13px; font-size:12px; font-weight:700; text-decoration:none;">Not Sure</a>
                </div>
                <p style="margin:0; font-size:12px; color:#92400e;">Note: If you select Not Bidding, we will not send you further updates for this invitation.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px; background:transparent; border-bottom:1px solid #e2e8f0;">
                <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:18px;">Project Details</div>
                <div style="font-size:14px; margin-bottom:14px;"><strong style="color:#0f172a;">Project Title:</strong> <span style="color:#334155;">${escapeHtml(input.packageName || "Tender Package")}</span></div>
                <div style="font-size:14px; margin-bottom:14px;"><strong style="color:#0f172a;">Scope of Work:</strong> <span style="color:#334155;">${escapeHtml(input.synopsis || "Please refer to the tender package documents for scope details.")}</span></div>
                ${input.siteLocation ? `<div style="font-size:14px; margin-bottom:14px;"><strong style="color:#0f172a;">Site Location:</strong> <span style="color:#334155;">${escapeHtml(input.siteLocation)}</span></div>` : ""}
                ${input.submissionDeadline ? `<div style="font-size:14px; margin-bottom:14px;"><strong style="color:#0f172a;">Submission Deadline:</strong> <span style="color:#334155;">${escapeHtml(input.submissionDeadline)}</span></div>` : ""}
                ${input.rfqDate ? `<div style="font-size:14px; margin-bottom:14px;"><strong style="color:#0f172a;">RFQ Date:</strong> <span style="color:#334155;">${escapeHtml(input.rfqDate)}</span></div>` : ""}
                <div style="font-size:14px;"><a href="${escapeHtml(input.detailsUrl)}" style="color:#4338ca; font-weight:600; text-decoration:underline;">View complete tender documents</a></div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px; background:#0f172a; color:#cbd5e1;">
                <div style="font-size:12px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px;">Organization Contact Details</div>
                <div style="font-size:13px; line-height:1.6;">
                  ${escapeHtml(branding.orgName)}<br/>
                  ${escapeHtml(input.contactName || "Procurement Team")} ${input.contactTitle ? `- ${escapeHtml(input.contactTitle)}` : ""}<br/>
                  ${escapeHtml(input.contactEmail || "procurement@organization.com")}<br/>
                  ${escapeHtml(input.contactPhone || "N/A")}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}
