import type { CallSheetDraft } from '../data/mockCallSheet'
import { emailAttachmentTypeLabels } from '../data/mockCallSheet'

function esc(value: string | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(value: string) {
  return esc(value).replace(/\n/g, '<br />')
}

function card(title: string, body: string) {
  return `
    <td style="width:50%;padding:6px;">
      <div style="border:1px solid #e6e8ec;border-radius:14px;padding:14px;background:#fafafa;">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;font-weight:700;">${esc(title)}</div>
        <div style="font-size:15px;line-height:1.45;color:#111827;margin-top:6px;">${nl2br(body || '-')}</div>
      </div>
    </td>`
}

function defaultIntro(draft: CallSheetDraft) {
  return draft.emailIntro || draft.distributionMessage || 'Please review the call sheet and linked production files before shoot day.'
}

function includedAttachments(draft: CallSheetDraft) {
  return draft.emailAttachments.filter((attachment) => attachment.included)
}

export function renderCallSheetEmailHtml(draft: CallSheetDraft) {
  const attachments = includedAttachments(draft)
  const timeline = draft.emailTimelineItems.filter((item) => item.time || item.text)
  const locationLine = draft.mainSetName || draft.emailSetDetails || 'Location TBD'
  const kickerParts = [draft.productionDate, locationLine].filter(Boolean).join(' / ')
  const senderLine = [draft.emailSenderName, draft.emailSenderTitle].filter(Boolean).join(', ')

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#08090d;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(draft.emailPreheader || 'Call sheet and production files for the next shoot day.')}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#08090d;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;">
            ${draft.emailHeroImageUrl ? `
            <tr>
              <td>
                <img src="${esc(draft.emailHeroImageUrl)}" alt="Vader: Whiteout" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:28px 28px 10px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-weight:700;">${esc(kickerParts || 'Vader: Whiteout')}</div>
                <h1 style="margin:10px 0 12px;font-size:30px;line-height:1.1;color:#111827;">${esc(draft.emailHeadline || draft.title || 'Call Sheet Ready')}</h1>
                <p style="margin:0;color:#374151;font-size:16px;line-height:1.6;">${nl2br(defaultIntro(draft))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    ${card('Call', draft.primaryCallTime || 'See call sheet')}
                    ${card(draft.emailTransportTitle || 'Transport', draft.emailTransportDetails || 'See production notes for transportation and arrival details.')}
                  </tr>
                  <tr>
                    ${card(draft.emailWeatherTitle || 'Weather', draft.emailWeatherDetails || draft.weatherSummary || 'See call sheet for weather details.')}
                    ${card(draft.emailSetTitle || 'Set', draft.emailSetDetails || draft.mainSetName || 'See call sheet for set details.')}
                  </tr>
                </table>
              </td>
            </tr>
            ${timeline.length ? `
            <tr>
              <td style="padding:8px 28px 0;">
                <h2 style="font-size:18px;color:#111827;margin:0 0 10px;">Quick Timeline</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${timeline.map((item) => `
                    <tr>
                      <td style="width:90px;padding:8px 0;color:#111827;font-weight:700;border-top:1px solid #edf0f3;">${esc(item.time)}</td>
                      <td style="padding:8px 0;color:#374151;border-top:1px solid #edf0f3;">${esc(item.text)}</td>
                    </tr>`).join('')}
                </table>
              </td>
            </tr>` : ''}
            ${draft.emailPrepNotes ? `
            <tr>
              <td style="padding:18px 28px 0;">
                <div style="border:1px solid #e6e8ec;border-radius:14px;padding:14px;background:#fff7ed;">
                  <h2 style="font-size:17px;color:#111827;margin:0 0 8px;">Please Prepare</h2>
                  <p style="margin:0;color:#374151;line-height:1.55;">${nl2br(draft.emailPrepNotes)}</p>
                </div>
              </td>
            </tr>` : ''}
            ${draft.emailSuppliesNotes ? `
            <tr>
              <td style="padding:12px 28px 0;">
                <div style="border:1px solid #e6e8ec;border-radius:14px;padding:14px;background:#f8fafc;">
                  <h2 style="font-size:17px;color:#111827;margin:0 0 8px;">Production-Provided Supplies</h2>
                  <p style="margin:0;color:#374151;line-height:1.55;">${nl2br(draft.emailSuppliesNotes)}</p>
                </div>
              </td>
            </tr>` : ''}
            ${attachments.length ? `
            <tr>
              <td style="padding:18px 28px 0;">
                <h2 style="font-size:18px;color:#111827;margin:0 0 10px;">Files for This Shoot</h2>
                <p style="margin:0 0 10px;color:#6b7280;font-size:14px;line-height:1.5;">Please review the linked production files before shoot day.</p>
                ${attachments.map((attachment) => `
                  <div style="padding:10px 0;border-top:1px solid #edf0f3;color:#374151;">
                    <strong style="color:#111827;">${esc(attachment.label || emailAttachmentTypeLabels[attachment.type])}</strong>
                    ${attachment.url ? `<br /><a href="${esc(attachment.url)}" style="color:#0f73a8;">${esc(attachment.fileName || attachment.url)}</a>` : `<br /><span style="color:#6b7280;">${attachment.type === 'call_sheet_pdf' ? 'Generated in Production Desk.' : 'Link pending.'}</span>`}
                    ${attachment.notes ? `<br /><span style="color:#6b7280;">${esc(attachment.notes)}</span>` : ''}
                  </div>`).join('')}
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:24px 28px 30px;">
                <p style="margin:0;color:#374151;line-height:1.6;">${nl2br(draft.emailClosingMessage || 'Thank you. Please confirm when you have reviewed the call sheet.')}</p>
                ${senderLine ? `<p style="margin:18px 0 0;color:#111827;font-weight:700;">${esc(senderLine)}</p>` : ''}
                <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">Vader: Whiteout Production Desk</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderCallSheetEmailText(draft: CallSheetDraft) {
  const attachments = includedAttachments(draft)
  const timeline = draft.emailTimelineItems.filter((item) => item.time || item.text)

  return [
    draft.emailHeadline || draft.title || 'Call Sheet Ready',
    '',
    defaultIntro(draft),
    '',
    `Production date: ${draft.productionDate || 'TBD'}`,
    `Primary crew call: ${draft.primaryCallTime || 'TBD'}`,
    `Set: ${draft.emailSetDetails || draft.mainSetName || 'TBD'}`,
    `Weather: ${draft.emailWeatherDetails || draft.weatherSummary || 'See call sheet'}`,
    draft.emailTransportDetails ? `Transport: ${draft.emailTransportDetails}` : '',
    timeline.length ? '\nQuick Timeline:' : '',
    ...timeline.map((item) => `${item.time} - ${item.text}`),
    draft.emailPrepNotes ? `\nPlease Prepare:\n${draft.emailPrepNotes}` : '',
    draft.emailSuppliesNotes ? `\nProduction-Provided Supplies:\n${draft.emailSuppliesNotes}` : '',
    attachments.length ? '\nFiles for This Shoot:' : '',
    ...attachments.map((attachment) => `${attachment.label || emailAttachmentTypeLabels[attachment.type]}${attachment.url ? `: ${attachment.url}` : ': generated/pending in Production Desk'}`),
    '',
    draft.emailClosingMessage || 'Thank you. Please confirm when you have reviewed the call sheet.',
    [draft.emailSenderName, draft.emailSenderTitle].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n')
}
