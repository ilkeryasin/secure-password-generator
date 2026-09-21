import fs from 'node:fs';

const packageJsonPath = './package.json';
const manifestPath = './public/manifest.json';

const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8')
);

const manifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8')
);

manifest.version = packageJson.version;

fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`
);

console.log(`Manifest version synced: ${packageJson.version}`);