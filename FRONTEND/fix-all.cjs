const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<<<<<<< HEAD')) {
        let lines = content.split('\n');
        let result = [];
        let inConflict = false;
        let inIncoming = false;

        for (let line of lines) {
          if (line.startsWith('<<<<<<< HEAD')) {
            inConflict = true;
            inIncoming = false;
            continue;
          }
          if (line.startsWith('=======')) {
            inIncoming = true;
            continue;
          }
          if (line.startsWith('>>>>>>>')) {
            inConflict = false;
            inIncoming = false;
            continue;
          }

          if (inConflict && inIncoming) {
            continue; // Skip incoming
          }
          result.push(line);
        }
        
        fs.writeFileSync(fullPath, result.join('\n'));
        console.log("Fixed " + fullPath);
      }
    }
  }
}

processDir('src');
