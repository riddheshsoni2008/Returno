const fs = require('fs');
const path = require('path');

const directoryPath = '/home/riddhesh/Desktop/fullstack project/druto-clone/frontend/src';

const classMappings = {
  // Replace opacities
  'opacity-50': 'opacity-80',
  'opacity-60': 'opacity-80',
  
  // Replace low contrast text colors
  'text-slate-300': 'text-text-muted',
  'text-slate-400': 'text-text-muted',
  'text-slate-450': 'text-text-secondary',
  'text-slate-500': 'text-text-secondary',
  'text-slate-505': 'text-text-secondary',
  
  'text-gray-300': 'text-text-muted',
  'text-gray-400': 'text-text-muted',
  'text-gray-500': 'text-text-secondary',
  
  'text-on-surface-variant': 'text-text-secondary',
  'text-outline': 'text-text-muted',
  'text-white/50': 'text-white/80',
  'text-white/60': 'text-white/80',
  
  // Also enforce heading colors for standard heading tags when used as utility
  'text-on-surface': 'text-text-primary',
  'text-slate-705': 'text-text-secondary',
  'text-slate-800': 'text-text-primary',
  'text-slate-900': 'text-text-primary',
  'text-slate-950': 'text-text-primary',
  'text-slate-955': 'text-text-primary',

  // Replace backgrounds according to rules
  'bg-surface-container-lowest': 'bg-bg-card',
  'bg-surface': 'bg-bg-card',
  'bg-surface-container-low': 'bg-bg-page',
  
  // Replace borders
  'border-outline-variant': 'border-border-standard',
  'border-slate-100': 'border-border-standard',
  'border-slate-150': 'border-border-standard',
  'border-slate-200': 'border-border-standard',
};

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk(directoryPath, function(err, results) {
  if (err) throw err;
  
  let modifiedFiles = [];
  
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace whole words only for Tailwind classes
    for (const [oldClass, newClass] of Object.entries(classMappings)) {
      // Create regex for exact tailwind class match avoiding partial matches
      // using word boundaries and whitespace/quote boundaries
      const regex = new RegExp(`(?<=[\\s"'\\\`])` + oldClass.replace(/\//g, '\\\\/') + `(?=[\\s"'\\\`])`, 'g');
      content = content.replace(regex, newClass);
    }
    
    // Ensure all font weights are at least 600 for important elements like h1-h6
    // Since we can't reliably parse DOM, we ensure text-text-primary is used in place of text-on-surface
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles.push(file.replace(directoryPath, ''));
    }
  });
  
  console.log("SUCCESS: Modified " + modifiedFiles.length + " files.");
  modifiedFiles.forEach(f => console.log(" - " + f));
});
