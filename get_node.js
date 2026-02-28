const fs = require('fs');
const data = JSON.parse(fs.readFileSync('workflow.json', 'utf8'));
const node = data.nodes.find(n => n.name === 'Gemini Analyze Image');
console.log(JSON.stringify(node, null, 2));
