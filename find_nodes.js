import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./node_modules/n8n-mcp/data/nodes.db');
db.all("SELECT name, workflowNodeType FROM nodes WHERE name LIKE '%WhatsApp%' OR name LIKE '%Chat Trigger%' OR name LIKE '%HTTP Request%'", [], (err, rows) => {
  if (err) throw err;
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
