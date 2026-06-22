const fs = require('fs');
const path = require('path');

const directoryPath = '/home/riddhesh/Desktop/fullstack project/druto-clone/frontend/src';

const classMappings = {
  'disabled:opacity-50': 'disabled:opacity-80',
  'disabled:opacity-60': 'disabled:opacity-80',
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
    
    for (const [oldClass, newClass] of Object.entries(classMappings)) {
      content = content.replace(new RegExp(oldClass, 'g'), newClass);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles.push(file.replace(directoryPath, ''));
    }
  });
  
  console.log("SUCCESS: Modified disabled opacities in " + modifiedFiles.length + " files.");
});
