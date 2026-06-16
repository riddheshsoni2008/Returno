const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'lib', 'models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add versionKey: false to schema options
  if (content.includes('timestamps: true')) {
    if (!content.includes('versionKey: false')) {
      content = content.replace(/timestamps: true(\s*)\}/, 'timestamps: true, versionKey: false$1}');
    }
  }

  // Remove unusable items from User
  if (file === 'User.js') {
    content = content.replace(/googleId:\s*\{\s*type:\s*String\s*\},?\n?/g, '');
  }

  // Rewrite to be clean
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
