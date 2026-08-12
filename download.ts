import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const textures = {
  mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  venus: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  earth: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  jupiter: 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  saturn: 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  saturn_ring: 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png',
  uranus: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  neptune: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  sun: 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg'
};

const dir = path.join(process.cwd(), 'public', 'textures');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function download(url: string, filename: string) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Handle redirects if any
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, filename).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filename);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
      file.on('error', (err) => {
        fs.unlink(filename, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  for (const [name, url] of Object.entries(textures)) {
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filePath = path.join(dir, `${name}${ext}`);
    try {
      console.log(`Downloading ${name}...`);
      await download(url, filePath);
      console.log(`Successfully downloaded ${name}`);
    } catch (err) {
      console.error(`Error downloading ${name}:`, err);
    }
  }
}

run();
