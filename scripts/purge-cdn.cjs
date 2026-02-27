const https = require('https');

const urls = [
    'https://purge.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js',
    'https://purge.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css',
    'https://purge.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@1.2.0/dist/lexflow.iife.js',
    'https://purge.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@1.2.0/dist/lexflow.css'
];

console.log('🚀 Iniciando purga de caché en jsDelivr...');

const purge = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ Purga exitosa: ${url}`);
                    try {
                        const json = JSON.parse(data);
                        console.log(`   Status: ${json.status}`);
                    } catch (e) {}
                    resolve();
                } else {
                    console.error(`❌ Error al purgar ${url}: ${res.statusCode}`);
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        }).on('error', (err) => {
            console.error(`❌ Error de red al purgar ${url}:`, err.message);
            reject(err);
        });
    });
};

Promise.all(urls.map(purge))
    .then(() => {
        console.log('\n✨ Proceso de purga completado. Los cambios deberían estar en vivo en breve.');
    })
    .catch(() => {
        console.error('\n⚠️ Hubo errores durante la purga de caché.');
        process.exit(1);
    });
