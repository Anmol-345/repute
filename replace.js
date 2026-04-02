const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-\\[#fafafa\\]': 'bg-background',
  'bg-\\[#ffffff\\]': 'bg-card',
  'bg-white': 'bg-card',
  'text-\\[#0a0a0a\\]': 'text-foreground',
  'text-\\[#111111\\]': 'text-foreground',
  'text-\\[#737373\\]': 'text-muted',
  'bg-\\[#f5f5f5\\]': 'bg-muted-bg',
  'border-\\[#e5e5e5\\]': 'border-border',
  'border-\\[#d4d4d4\\]': 'border-border-strong',
  'bg-\\[#0f172a\\]': 'bg-accent',
  'bg-\\[#000000\\]': 'bg-accent',
  'text-\\[#a3a3a3\\]': 'text-muted-foreground',
  'text-\\[#666666\\]': 'text-muted',
  'bg-\\[#222222\\]': 'bg-accent-hover',
  'hover:bg-\\[#1e293b\\]': 'hover:bg-accent-hover',
  'text-\\[#2563eb\\]': 'text-accent-blue',
  'hover:border-\\[#d4d4d4\\]': 'hover:border-border-strong',
  'focus:ring-\\[#0f172a\\]': 'focus:ring-accent'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(__dirname);

files.forEach(file => {
  if(file.includes('replace.js') || file.includes('tailwind.config.js')) return;
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g');
    if (regex.test(text)) {
      text = text.replace(regex, value);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, text);
    console.log('Updated', file);
  }
});
