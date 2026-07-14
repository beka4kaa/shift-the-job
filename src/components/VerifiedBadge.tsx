import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  /** Whether this teacher has at least one VERIFIED certificate. */
  verified: boolean;
  /** Optional extra classes for the wrapper. */
  className?: string;
}

/**
 * Parent-facing trust signal. Renders a checkmark badge only when the teacher
 * has a verified credential, and nothing at all otherwise — so an unverified
 * (or pending/rejected) tutor never appears verified.
 *
 * The `verified` prop is derived upstream from real certificate data
 * (see `certificatesAreVerified` in `@/lib/teacher-profile`), so flipping a
 * certificate's `verificationStatus` in the database toggles this badge.
 */
export function VerifiedBadge({ verified, className }: VerifiedBadgeProps) {
  if (!verified) return null;

  return (
    <span
      role="img"
      aria-label="Verified tutor"
      title="Verified tutor"
      className={className}
    >
      <BadgeCheck className="w-6 h-6 text-blue-400" />
    </span>
  );
}
