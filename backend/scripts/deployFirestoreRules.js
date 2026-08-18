/**
 * Publish firestore.rules to the project using the Admin service-account
 * credential — a scriptable stand-in for `firebase deploy --only firestore:rules`
 * that needs no Firebase CLI login.
 *
 *   cd backend && npm run deploy:rules
 *
 * Uses the Firebase Security Rules REST API: create a ruleset from the repo's
 * firestore.rules, then point the `cloud.firestore` release at it. Requires the
 * service account (backend/.env) to have rules admin permission (the default
 * Editor / Firebase Admin roles do).
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApps } from 'firebase-admin/app';

import '../config/firebase.js'; // initialises the Admin app

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const API = 'https://firebaserules.googleapis.com/v1';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, '..', '..', 'firestore.rules');

const main = async () => {
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  const { access_token: token } = await getApps()[0].options.credential.getAccessToken();
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1) Create a ruleset from the source.
  const rsRes = await fetch(`${API}/projects/${PROJECT}/rulesets`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: rules }] } }),
  });
  const rs = await rsRes.json();
  if (!rsRes.ok) {
    console.error('✗ Ruleset create failed:', JSON.stringify(rs.error ?? rs));
    process.exit(1);
  }
  console.log('✓ Ruleset created:', rs.name);

  // 2) Point the Firestore release at the new ruleset (patch, then create).
  const releaseName = `projects/${PROJECT}/releases/cloud.firestore`;
  const body = JSON.stringify({ release: { name: releaseName, rulesetName: rs.name } });

  let relRes = await fetch(`${API}/${releaseName}`, { method: 'PATCH', headers: auth, body });
  if (relRes.status === 404) {
    relRes = await fetch(`${API}/projects/${PROJECT}/releases`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ name: releaseName, rulesetName: rs.name }),
    });
  }
  const rel = await relRes.json();
  if (!relRes.ok) {
    console.error('✗ Release update failed:', JSON.stringify(rel.error ?? rel));
    process.exit(1);
  }

  console.log('✓ firestore.rules is now live on', PROJECT);
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Deploy failed:', error.message);
  process.exit(1);
});
