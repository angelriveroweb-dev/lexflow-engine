const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/angel/.local/share/opencode/tool-output/tool_ca4e304b60013KWDTJn1YFGwvS', 'utf8'));
const node = data.data.nodes.find(n => n.name === 'Gemini Analyze Image');
console.log(JSON.stringify(node, null, 2));
