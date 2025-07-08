const { compileFunc } = require('@ton-community/func-js');
const fs = require('fs');
const path = require('path');

async function compileTarget(target) {
    const sources = {};
    const contractsDir = path.resolve(__dirname, '..', 'contracts');
    (function scan(dir) {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) scan(p);
            else if (p.endsWith('.fc')) sources[p] = fs.readFileSync(p).toString();
        }
    })(contractsDir);

    const result = await compileFunc({ targets: [target], sources });
    if (result.status === 'error') throw new Error(result.message);
    const boc = Buffer.from(result.codeBoc, 'base64');
    return boc;
}
module.exports = { compileTarget };
