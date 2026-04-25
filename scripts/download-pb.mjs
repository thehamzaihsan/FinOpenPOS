import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { get } from 'https';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PB_VERSION = '0.22.14'; // Use a stable version
const TARGET_DIR = path.join(__dirname, '..', 'src-tauri', 'bin');

if (!existsSync(TARGET_DIR)) {
  mkdirSync(TARGET_DIR, { recursive: true });
}

const platforms = [
  {
    name: 'pocketbase-x86_64-unknown-linux-gnu',
    url: `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`,
  },
  {
    name: 'pocketbase-x86_64-pc-windows-msvc.exe',
    url: `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_windows_amd64.zip`,
  },
  {
    name: 'pocketbase-x86_64-apple-darwin',
    url: `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_darwin_amd64.zip`,
  },
  {
    name: 'pocketbase-aarch64-apple-darwin',
    url: `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_darwin_arm64.zip`,
  },
];

async function downloadAndExtract(platform) {
  const zipPath = path.join(TARGET_DIR, `${platform.name}.zip`);
  const binPath = path.join(TARGET_DIR, platform.name);

  console.log(`Downloading ${platform.name}...`);
  
  return new Promise((resolve, reject) => {
    const file = createWriteStream(zipPath);
    get(platform.url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Extracting ${platform.name}...`);
        
        try {
          if (platform.name.includes('windows')) {
            execSync(`unzip -o "${zipPath}" -d "${TARGET_DIR}" && mv "${TARGET_DIR}/pocketbase.exe" "${binPath}"`);
          } else {
            execSync(`unzip -o "${zipPath}" -d "${TARGET_DIR}" && mv "${TARGET_DIR}/pocketbase" "${binPath}" && chmod +x "${binPath}"`);
          }
          execSync(`rm "${zipPath}"`);
          console.log(`Successfully prepared ${platform.name}`);
          resolve();
        } catch (err) {
          console.error(`Failed to extract ${platform.name}:`, err);
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  for (const platform of platforms) {
    await downloadAndExtract(platform);
  }
}

run();
