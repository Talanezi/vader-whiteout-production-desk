import { CallSheetDraft, EmailAttachment } from '../callsheet.types';

function esc(value: string | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(value: string) {
  return esc(value).replace(/\n/g, '<br />');
}

function includedAttachments(draft: CallSheetDraft): EmailAttachment[] {
  return draft.emailAttachments.filter((attachment) => attachment.included);
}

function card(title: string, body: string) {
  return `
    <td style="width:50%;padding:7px;vertical-align:top;">
      <div style="border:1px solid #e4e7ec;border-radius:16px;padding:16px;background:#fbfbfc;">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#667085;font-weight:700;">${esc(title)}</div>
        <div style="font-size:15px;line-height:1.5;color:#101828;margin-top:8px;">${nl2br(body || '-')}</div>
      </div>
    </td>`;
}

export function buildCallSheetEmailHtml(draft: CallSheetDraft) {
  const attachments = includedAttachments(draft);
  const timeline = draft.emailTimelineItems.filter((item) => item.time || item.text);
  const intro = draft.emailIntro || draft.distributionMessage || 'Hello everyone, please review the call sheet and linked production files before shoot day.';
  const locationLine = draft.mainSetName || draft.emailSetDetails || 'Location TBD';
  const kicker = [draft.productionDate, locationLine].filter(Boolean).join(' / ');
  const senderLine = [draft.emailSenderName, draft.emailSenderTitle].filter(Boolean).join(', ');
  const setDetails = draft.emailSetDetails || draft.mainSetName || draft.mainSetAddress.join(', ') || 'See call sheet for set details.';
  const weatherDetails = draft.emailWeatherDetails || draft.weatherSummary || 'See call sheet for weather details.';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#08090d;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(draft.emailPreheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#08090d;padding:34px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
          ${draft.emailHeroImageUrl ? `<tr><td><img src="${esc(draft.emailHeroImageUrl)}" alt="Vader: Whiteout" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" /></td></tr>` : ''}
          <tr><td style="padding:34px 34px 14px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#667085;font-weight:700;">${esc(kicker || 'Vader: Whiteout')}</div>
            <h1 style="margin:12px 0 14px;font-size:32px;line-height:1.08;color:#101828;">${esc(draft.emailHeadline || draft.title || 'Call Sheet Ready')}</h1>
            <p style="margin:0;color:#344054;font-size:16px;line-height:1.65;">${nl2br(intro)}</p>
          </td></tr>
          <tr><td style="padding:14px 27px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>${card('Call', draft.primaryCallTime || 'See call sheet')}${card(draft.emailTransportTitle || 'Transport', draft.emailTransportDetails || 'See production notes for transportation and arrival details.')}</tr>
              <tr>${card(draft.emailWeatherTitle || 'Weather', weatherDetails)}${card(draft.emailSetTitle || 'Set', setDetails)}</tr>
            </table>
          </td></tr>
          ${timeline.length ? `<tr><td style="padding:16px 34px 0;"><h2 style="font-size:18px;color:#101828;margin:0 0 10px;">Quick Timeline</h2>${timeline.map((item) => `<div style="padding:10px 0;border-top:1px solid #eaecf0;color:#344054;"><strong style="color:#101828;">${esc(item.time)}</strong> ${esc(item.text)}</div>`).join('')}</td></tr>` : ''}
          ${draft.emailPrepNotes ? `<tr><td style="padding:20px 34px 0;"><div style="border:1px solid #fedf89;border-radius:16px;padding:16px;background:#fffbeb;"><h2 style="font-size:17px;color:#101828;margin:0 0 8px;">Please Prepare</h2><p style="margin:0;color:#344054;line-height:1.6;">${nl2br(draft.emailPrepNotes)}</p></div></td></tr>` : ''}
          ${draft.emailSuppliesNotes ? `<tr><td style="padding:14px 34px 0;"><div style="border:1px solid #d0d5dd;border-radius:16px;padding:16px;background:#f8fafc;"><h2 style="font-size:17px;color:#101828;margin:0 0 8px;">Production Supplies / Provided Items</h2><p style="margin:0;color:#344054;line-height:1.6;">${nl2br(draft.emailSuppliesNotes)}</p></div></td></tr>` : ''}
          ${attachments.length ? `<tr><td style="padding:22px 34px 0;"><h2 style="font-size:18px;color:#101828;margin:0 0 8px;">Files for This Shoot</h2><p style="margin:0 0 12px;color:#667085;font-size:14px;line-height:1.55;">Please review the linked production files before shoot day.</p>${attachments.map((attachment) => `<div style="padding:12px 0;border-top:1px solid #eaecf0;color:#344054;"><strong style="color:#101828;">${esc(attachment.label)}</strong>${attachment.url ? `<br /><a href="${esc(attachment.url)}" style="color:#0f73a8;text-decoration:underline;">${esc(attachment.fileName || attachment.url)}</a>` : `<br /><span style="color:#667085;">${attachment.type === 'call_sheet_pdf' ? 'Generated in Production Desk.' : 'Link pending.'}</span>`}${attachment.notes ? `<br /><span style="color:#667085;">${esc(attachment.notes)}</span>` : ''}</div>`).join('')}</td></tr>` : ''}
          <tr><td style="padding:28px 34px 34px;">
            <p style="margin:0;color:#344054;line-height:1.65;">${nl2br(draft.emailClosingMessage || 'Thank you. Please confirm when you have reviewed the call sheet.')}</p>
            ${senderLine ? `<p style="margin:20px 0 0;color:#101828;font-weight:700;">${esc(senderLine)}</p>` : ''}
            <p style="margin:20px 0 0;color:#98a2b3;font-size:12px;">Vader: Whiteout Production Desk</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function buildCallSheetEmailText(draft: CallSheetDraft) {
  const attachments = includedAttachments(draft);
  const timeline = draft.emailTimelineItems.filter((item) => item.time || item.text);

  return [
    draft.emailHeadline || draft.title || 'Call Sheet Ready',
    '',
    draft.emailIntro || draft.distributionMessage || 'Please review the call sheet and linked production files before shoot day.',
    '',
    `Production date: ${draft.productionDate || 'TBD'}`,
    `Primary crew call: ${draft.primaryCallTime || 'TBD'}`,
    `Set: ${draft.emailSetDetails || draft.mainSetName || 'TBD'}`,
    timeline.length ? '\nQuick Timeline:' : '',
    ...timeline.map((item) => `${item.time} - ${item.text}`),
    draft.emailPrepNotes ? `\nPlease Prepare:\n${draft.emailPrepNotes}` : '',
    draft.emailSuppliesNotes ? `\nProduction-Provided Supplies:\n${draft.emailSuppliesNotes}` : '',
    attachments.length ? '\nFiles for This Shoot:' : '',
    ...attachments.map((attachment) => `${attachment.label}${attachment.url ? `: ${attachment.url}` : ': generated/pending in Production Desk'}`),
    '',
    draft.emailClosingMessage || 'Thank you. Please confirm when you have reviewed the call sheet.',
    [draft.emailSenderName, draft.emailSenderTitle].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n');
}
