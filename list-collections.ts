
import { iterateDocuments } from './src/core/leveldb-reader.js';
import { homedir } from 'os';
import { join } from 'path';

async function main() {
  const dbPath = join(
    homedir(),
    'Library/Containers/com.copilot.production/Data/Library',
    'Application Support/firestore/__FIRAPP_DEFAULT',
    'copilot-production-22904/main'
  );

  const collections = new Set();
  try {
    for await (const doc of iterateDocuments(dbPath)) {
      collections.add(doc.collection);
    }
    console.log('Found collections:');
    for (const coll of Array.from(collections).sort()) {
      console.log(` - ${coll}`);
    }
  } catch (error) {
    console.error('Error reading database:', error);
  }
}

main();
