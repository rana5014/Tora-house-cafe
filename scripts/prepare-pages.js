import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const assetsDir = path.join(distDir, 'assets');

console.log('🚀 Preparing GitHub Pages deployment assets...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found! Run vite build first.');
  process.exit(1);
}

// Find JS and CSS asset files
let jsFile = '';
let cssFile = '';

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  for (const file of files) {
    if (file.endsWith('.js') && file.startsWith('index-')) {
      jsFile = file;
    }
    if (file.endsWith('.css') && file.startsWith('index-')) {
      cssFile = file;
    }
  }
}

if (!jsFile || !cssFile) {
  console.error('❌ Could not find hashed JS and CSS assets in dist/assets!');
  process.exit(1);
}

console.log(`✓ Detected JS bundle: ${jsFile}`);
console.log(`✓ Detected CSS stylesheet: ${cssFile}`);

// Copy asset files from dist/assets to dist root so they exist in BOTH locations
fs.copyFileSync(path.join(assetsDir, jsFile), path.join(distDir, jsFile));
fs.copyFileSync(path.join(assetsDir, cssFile), path.join(distDir, cssFile));
console.log('✓ Copied assets to dist root for dual-path compatibility.');

// Ensure .nojekyll exists
fs.writeFileSync(path.join(distDir, '.nojekyll'), 'Disable Jekyll processing on GitHub Pages\n', 'utf8');
console.log('✓ Verified .nojekyll in dist.');

// Generate resilient index.html & 404.html
const htmlContent = `<!DOCTYPE html>
<html lang="en" dir="ltr" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>TORA HOUSE | Coffee • Tea • Juices — بيت تورا</title>
    <meta name="description" content="TORA HOUSE - Fresh Taste. Every Moment. Premium specialty coffee, iced refreshers, mojitos, artisanal tea, and fresh bakery in Saudi Arabia." />
    <meta name="keywords" content="Tora House, Coffee, Tea, Juices, Riyadh, Saudi Arabia, Spanish Latte, V60, Mojito, Cafe" />
    
    <!-- Google Fonts: Cairo, Inter, Playfair Display, Tajawal -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">

    <!-- Moyasar Saudi Payment Gateway (Mada, Visa, Mastercard, Apple Pay) -->
    <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css">
    <script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"></script>

    <!-- Primary CSS with Automatic Fallback for Root and Assets -->
    <link rel="stylesheet" id="tora-theme-css" crossorigin href="/Tora-house-cafe/${cssFile}">
    <script>
      (function() {
        var base = window.location.pathname.startsWith('/Tora-house-cafe') ? '/Tora-house-cafe/' : './';
        var cssEl = document.getElementById('tora-theme-css');
        if (cssEl) {
          if (!window.location.pathname.startsWith('/Tora-house-cafe')) {
            cssEl.href = base + '${cssFile}';
          }
          cssEl.onerror = function() {
            this.onerror = null;
            this.href = base + 'assets/${cssFile}';
          };
        }
      })();
    </script>
  </head>
  <body class="bg-[#0c0a09] text-stone-100 antialiased selection:bg-amber-500 selection:text-black min-h-screen">
    <div id="root"></div>

    <!-- Universal Resilient Module Loader for GitHub Pages -->
    <script type="module">
      (function() {
        var base = window.location.pathname.startsWith('/Tora-house-cafe') ? '/Tora-house-cafe/' : './';
        var jsName = '${jsFile}';
        
        function load(src, fallback) {
          var s = document.createElement('script');
          s.type = 'module';
          s.crossOrigin = 'anonymous';
          s.src = src;
          if (fallback) {
            s.onerror = function() {
              load(fallback, null);
            };
          }
          document.head.appendChild(s);
        }

        // Try root first (matches current GitHub Pages repo), then fallback to assets/
        load(base + jsName, base + 'assets/' + jsName);
      })();
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf8');
fs.writeFileSync(path.join(distDir, '404.html'), htmlContent, 'utf8');
console.log('✓ Generated resilient index.html and 404.html');

// Destination staging directories
const downloadDir = '/sdcard/Download';
const deployDir = path.join(downloadDir, 'TORA-HOUSE-PAGES-DEPLOY');
const deployZip = path.join(downloadDir, 'tora-house-pages-deploy.zip');

if (fs.existsSync(downloadDir)) {
  // Clean and recreate deploy directory
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir, { recursive: true });
  
  // Copy all dist files into deployDir including dotfiles (.nojekyll)
  execSync(`cp -r "${distDir}"/* "${deployDir}"/`);
  if (fs.existsSync(path.join(distDir, '.nojekyll'))) {
    fs.copyFileSync(path.join(distDir, '.nojekyll'), path.join(deployDir, '.nojekyll'));
  }
  console.log(`✓ Copied deployment files (including .nojekyll) to: ${deployDir}`);

  // Create ZIP archive with all files and .nojekyll
  if (fs.existsSync(deployZip)) {
    fs.unlinkSync(deployZip);
  }
  execSync(`cd "${distDir}" && zip -r "${deployZip}" ./* .nojekyll`);
  console.log(`✓ Created fresh ZIP package with .nojekyll: ${deployZip}`);
} else {
  console.log(`ℹ Download directory ${downloadDir} not available; build packaged in dist/.`);
}

console.log('🎉 GitHub Pages deployment preparation complete!');
