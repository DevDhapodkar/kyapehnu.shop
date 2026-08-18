/**
 * Grant (or revoke) admin rights on an account, so it can use the vendor-review
 * panel. Sets the Firebase custom claim `admin: true` on the user; the token
 * carries it after their next sign-in, and `requireAdmin` honours it.
 *
 * The very first admin can alternatively be bootstrapped with the ADMIN_EMAILS
 * env var (no script needed) — this script is the durable, per-account way.
 *
 * Usage:
 *   node scripts/setAdmin.js --email you@example.com
 *   node scripts/setAdmin.js --email you@example.com --revoke
 */

import 'dotenv/config';

import { firebaseAuth } from '../config/firebase.js';

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.email) {
    console.error('Missing --email. Usage: node scripts/setAdmin.js --email you@example.com [--revoke]');
    process.exit(1);
  }

  const grant = !args.revoke;

  const user = await firebaseAuth.getUserByEmail(args.email);
  // Preserve any existing claims; just flip `admin`.
  const claims = { ...(user.customClaims || {}), admin: grant };
  if (!grant) delete claims.admin;

  await firebaseAuth.setCustomUserClaims(user.uid, claims);
  console.log(`✓ ${user.email} admin=${grant}. They must sign out/in for the new token to take effect.`);
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Failed to set admin claim:', error.message);
  process.exit(1);
});
