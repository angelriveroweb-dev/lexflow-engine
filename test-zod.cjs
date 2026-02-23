const { workflowNodeSchema } = require('./node_modules/n8n-mcp/dist/services/n8n-validation');
const node = {
    id: '123',
    name: 'Test',
    type: 'n8n-nodes-base.noOp',
    typeVersion: 1,
    position: [0, 0],
    parameters: {}
};
try {
    console.log('Validating node...');
    workflowNodeSchema.parse(node);
    console.log('Validation successful');
} catch (error) {
    console.error('Validation failed:', error);
}
