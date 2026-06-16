const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'lib', 'models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove deviceFingerprint and ipAddress
  content = content.replace(/ipAddress:\s*\{\s*type:\s*String\s*\},?\n?/g, '');
  content = content.replace(/deviceFingerprint:\s*\{\s*type:\s*String\s*\},?\n?/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file}`);
});
