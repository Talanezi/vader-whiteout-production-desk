import { ForbiddenException } from '@nestjs/common';
export function assertProductionMember(user: any) {
  const m = user.productionMembership;
  const production = process.env.PRODUCTION_ID || 'whiteout';
  // This Scheduler deployment is authoritative for Whiteout. Old signed-in claims
  // predate an explicit production field; explicit foreign-production claims fail.
  if (
    !m ||
    m.verified !== true ||
    !Number.isSafeInteger(user.userID) ||
    m.userID !== user.userID ||
    m.email !== user.email.toLowerCase() ||
    (m.productionId || m.production || 'whiteout') !== production ||
    typeof m.verifiedAt !== 'string' ||
    !Number.isFinite(Date.parse(m.verifiedAt))
  )
    throw new ForbiddenException(
      'Verified membership in this production is required.',
    );
}
