const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/angel/.local/share/opencode/tool-output/tool_ca517e1b4001BjUHNFs928MEnM', 'utf8'));
const node = data.data.nodes.find(n => n.name === 'Supabase: Log Abandonment');
console.log(JSON.stringify(node, null, 2));
