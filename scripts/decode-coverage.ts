#!/usr/bin/env bun
/**
 * Decode coverage report — measures what % of the LevelDB we actually decode.
 *
 * Iterates every document in the database, groups by collection path pattern,
 * and reports decoded vs undecoded counts.
 *
 * Usage: bun run scripts/decode-coverage.ts
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { iterateDocuments } from '../src/core/leveldb-reader.js';

function findRealDatabase(): string | undefined {
  const home = homedir();
  const containerBase = join(
    home,
    'Library/Containers/com.copilot.production/Data/Library/Application Support'
  );

  if (!existsSync(containerBase)) return undefined;

  const firestorePath = join(containerBase, 'firestore/__FIRAPP_DEFAULT');
  if (!existsSync(firestorePath)) return undefined;

  const entries = readdirSync(firestorePath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('copilot-')) {
      const mainPath = join(firestorePath, entry.name, 'main');
      if (existsSync(mainPath)) {
        return mainPath;
      }
    }
  }

  return undefined;
}

function getDatabaseSizeMB(dbPath: string): number {
  let totalSize = 0;
  const files = readdirSync(dbPath);
  for (const file of files) {
    const filePath = join(dbPath, file);
    const stat = statSync(filePath);
    if (stat.isFile()) {
      totalSize += stat.size;
    }
  }
  return totalSize / (1024 * 1024);
}

/**
 * Normalize a collection path to a pattern for grouping.
 * Strips the Firestore prefix (projects/.../documents/) if present,
 * then replaces specific IDs (odd-indexed path segments) with '*'.
 */
function normalizeCollectionPath(collection: string): string {
  const docsIdx = collection.indexOf('/documents/');
  const stripped = docsIdx >= 0 ? collection.slice(docsIdx + '/documents/'.length) : collection;

  const parts = stripped.split('/');
  return parts.map((part, i) => (i % 2 === 1 ? '*' : part)).join('/');
}

/**
 * Check if a raw collection path is decoded by matching against decodeAllCollections logic.
 * Mirrors the if/else chain in decoder.ts exactly: uses collectionMatches(collection, target)
 * which checks (collection === target || collection.endsWith('/' + target)).
 */
function isDecoded(rawCollection: string): boolean {
  function matches(target: string): boolean {
    return rawCollection === target || rawCollection.endsWith(`/${target}`);
  }

  // Mirror the exact if/else order from decodeAllCollections:
  if (rawCollection.includes('users/') && rawCollection.endsWith('/accounts')) return true;
  if (matches('transactions')) return true;
  if (matches('accounts')) return true;
  if (matches('recurring')) return true;
  if (matches('budgets')) return true;
  if (matches('financial_goals')) return true;
  if (rawCollection.endsWith('/financial_goal_history')) return true;
  if (matches('investment_prices') || rawCollection.includes('investment_prices/')) return true;
  if (matches('investment_splits')) return true;
  if (matches('items')) return true;
  if (matches('categories')) return true;

  return false;
}

async function main() {
  const dbPath = findRealDatabase();
  if (!dbPath) {
    console.error('Could not find Copilot Money database');
    process.exit(1);
  }

  const sizeMB = getDatabaseSizeMB(dbPath);
  console.log(`Database: ${dbPath}`);
  console.log(`Database size: ${sizeMB.toFixed(1)} MB\n`);

  // Count documents by raw collection path
  const rawCounts = new Map<string, number>();
  let totalDocs = 0;

  console.log('Scanning all documents...');
  const start = Date.now();

  for await (const doc of iterateDocuments(dbPath)) {
    totalDocs++;
    rawCounts.set(doc.collection, (rawCounts.get(doc.collection) ?? 0) + 1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Scanned ${totalDocs.toLocaleString()} documents in ${elapsed}s\n`);

  // Categorize by checking isDecoded against raw paths, then aggregate by normalized pattern
  const decodedByPattern = new Map<string, number>();
  const undecodedByPattern = new Map<string, number>();
  let decodedDocs = 0;
  let undecodedDocs = 0;

  for (const [rawPath, count] of rawCounts.entries()) {
    const pattern = normalizeCollectionPath(rawPath);
    if (isDecoded(rawPath)) {
      decodedDocs += count;
      decodedByPattern.set(pattern, (decodedByPattern.get(pattern) ?? 0) + count);
    } else {
      undecodedDocs += count;
      undecodedByPattern.set(pattern, (undecodedByPattern.get(pattern) ?? 0) + count);
    }
  }

  const decodedCollections = [...decodedByPattern.entries()].sort((a, b) => b[1] - a[1]);
  const undecodedCollections = [...undecodedByPattern.entries()].sort((a, b) => b[1] - a[1]);

  const pct = ((decodedDocs / totalDocs) * 100).toFixed(1);

  // Report
  console.log('='.repeat(70));
  console.log(`DECODE COVERAGE: ${decodedDocs.toLocaleString()} / ${totalDocs.toLocaleString()} documents (${pct}%)`);
  console.log('='.repeat(70));

  console.log(`\nDECODED (${decodedCollections.length} collection patterns, ${decodedDocs.toLocaleString()} docs):`);
  for (const [pattern, count] of decodedCollections) {
    console.log(`  ${count.toString().padStart(8)}  ${pattern}`);
  }

  console.log(`\nNOT DECODED (${undecodedCollections.length} collection patterns, ${undecodedDocs.toLocaleString()} docs):`);
  for (const [pattern, count] of undecodedCollections) {
    console.log(`  ${count.toString().padStart(8)}  ${pattern}`);
  }

  const totalPatterns = decodedCollections.length + undecodedCollections.length;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Collections: ${totalPatterns} total | ${decodedCollections.length} decoded | ${undecodedCollections.length} remaining`);
  console.log(`Documents:   ${totalDocs.toLocaleString()} total | ${decodedDocs.toLocaleString()} decoded (${pct}%) | ${undecodedDocs.toLocaleString()} remaining`);
}

main().catch(console.error);
