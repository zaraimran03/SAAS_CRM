const fs = require('fs');
const files = [
  'src/styles/Dashboard.css',
  'src/components/Sidebar.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Simple resolver: keep HEAD
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
  
  fs.writeFileSync(file, result.join('\n'));
}
