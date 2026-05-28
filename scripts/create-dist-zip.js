const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const distPath = path.join(__dirname, '../dist');
const zipPath = path.join(__dirname, '../dist.zip');

if (!fs.existsSync(distPath)) {
  console.error('dist folder does not exist');
  process.exit(1);
}

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);

console.log(`Created ${zipPath}`);
