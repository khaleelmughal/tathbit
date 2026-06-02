#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function* walkFiles(dir, extension = '.json') {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath, extension);
    } else if (entry.name.endsWith(extension)) {
      yield fullPath;
    }
  }
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    const lineNumber = error.message.match(/position (\d+)/)?.[1] || 
                       error.message.match(/line (\d+)/)?.[1] || 
                       'unknown';
    return { 
      valid: false, 
      error: error.message,
      line: lineNumber 
    };
  }
}

console.log('Validating JSON files in content/ folder...\n');

let totalFiles = 0;
let brokenFiles = 0;

for (const filePath of walkFiles('./content')) {
  totalFiles++;
  const result = validateJSON(filePath);
  
  if (!result.valid) {
    brokenFiles++;
    console.log(`❌ ${filePath}`);
    console.log(`   Line: ${result.line}`);
    console.log(`   Error: ${result.error}\n`);
  }
}

console.log(`\nValidation complete:`);
console.log(`Total files checked: ${totalFiles}`);
console.log(`Broken files: ${brokenFiles}`);

if (brokenFiles === 0) {
  console.log('✅ All JSON files are valid!');
  process.exit(0);
} else {
  console.log('❌ Some JSON files have errors and need fixing.');
  process.exit(1);
}