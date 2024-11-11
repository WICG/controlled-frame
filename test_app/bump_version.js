import fs from 'fs';

const tagPrefix = 'test-app-v';
const version = process.env?.VERSION;

if (version) {
  version = version.replace(tagPrefix, '');
} else {
  throw new Error('No version found');
}

const manifest = JSON.parse(
  fs.readFileSync('./public/.well-known/manifest.webmanifest', 'utf-8'),
);

manifest.version = version;

fs.writeFileSync(
  './public/.well-known/manifest.webmanifest',
  JSON.stringify(manifest, null, 2),
);

let versions;

try {
  versions = JSON.parse(process.env.TAGS)
    .filter((tag) => tag.startsWith(tagPrefix))
    .map((tag) => {
      const v = tag.ref.replace(tagPrefix, '');
      return {
        version: v,
        src: `https://github.com/WICG/controlled-frame/releases/download/${tagPrefix}${v}/controlled-frame-test-app.swbn`,
      };
    });
} catch (e) {
  throw new Error('No tags');
}

const updateManifest = {
  versions,
};

fs.writeFileSync('./controlled-frame-test-app-update.json', JSON.stringify(updateManifest));
