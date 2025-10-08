#!/usr/bin/env node

require('dotenv/config');

const env = require('envalid').cleanEnv(process.env, {

});

const cpy               = require('cpy').default;
const fs                = require('node:fs');
// const { dirname }       = require('node:path');
// const { fileURLToPath } = require('node:url');
// const { exec }          = require('node:child_process');
const esbuild           = require('esbuild');
const { nodeModulesPolyfillPlugin } = require('esbuild-plugins-node-modules-polyfill');

const define = {
//   'process.env.BASEURL_APP': process.env.BASEURL_APP || '"http://localhost:4000/#!"',
};

const entryPoints = {
  'main': __dirname + '/src/main.ts',
};

const config = {
  format: 'cjs',
  platform: 'browser',
  target: ['chrome108','firefox107'],
  mainFields: ['browser','module','main'],
  bundle: true,
  outdir: __dirname + '/dist',
  entryPoints: [
    ...Object.values(entryPoints),
    // __dirname+'/src/service-worker.ts',
  ],
  minify: false,
  define,

  jsxFactory     : 'm',
  jsxFragment    : '"["',

  loader: {
    '.eot'  : 'dataurl',
    '.html' : 'text',
    '.wasm' : 'dataurl',
    '.png'  : 'dataurl',
    '.svg'  : 'dataurl',
    '.ttf'  : 'dataurl',
    '.woff' : 'dataurl',
    '.woff2': 'dataurl',
  },

  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        Buffer: true
      }
    })
  ],

};

const buildList = [];
const styles    = ['global.css'];

esbuild
  .build(config)
  .then(async () => {
    try { fs.mkdirSync('./dist/assets'); } catch { /* empty */ }
    await cpy(__dirname + '/src/assets/*', __dirname + '/dist/assets');
    await cpy(__dirname + '/src/assets/**/*', __dirname + '/dist/assets');
//     try { fs.mkdirSync('./dist/AppModule'); } catch { /* empty */ }
    fs.copyFileSync(`./src/global.css`, `./dist/global.css`);
    for(const name of Object.keys(entryPoints)) {
      buildList.push(`${name}.js`);
      try {
        fs.statSync(config.outdir + `/${name}.css`);
        styles.push(`${name}.css`);
      } catch(e) {
        // Intentionally empty
      }
    }

    fs.writeFileSync(config.outdir + `/index.html`, `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0">
    <!-- <link rel="icon" href="/assets/favicon.ico"> -->
    <!-- <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"> -->
    <!-- <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192x192.png"> -->
    <!-- <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512x512.png"> -->
    <!-- <link rel="manifest" href="/assets/manifest.json"/> -->
    <link rel="stylesheet" href="assets/fonts/karla/karla.css"/>
    ${styles.map(name => `<link rel="preload" as="style" href="${name}" onload="this.onload=null;this.rel='stylesheet'"/>`).join('\n    ')}
  </head>
  <body>
    ${buildList.map(name => `<script type="module" src="${name}" defer></script>`).join('\n    ')}
  </body>
</html>
`);

//     // Build favicons
//     await new Promise(done => {
//       exec(`ffmpeg -n -i ${config.outdir}/assets/icon.png -vf scale=32:32 -sws_flags area ${config.outdir}/assets/favicon.ico`, done);
//     });
//     await new Promise(done => {
//       exec(`ffmpeg -n -i ${config.outdir}/assets/icon.png -vf scale=180:180 -sws_flags area ${config.outdir}/assets/apple-touch-icon.png`, done);
//     });

//     // Build app icons
//     const manifest = require(__dirname+'/dist/assets/manifest.json');
//     for(const format of manifest.icons) {
//       const scale = format.sizes.split('x').join(':');
//       await new Promise(done => {
//         exec(`ffmpeg -n -i ${config.outdir}/assets/icon.png -vf scale=${scale} -sws_flags area ${config.outdir}${format.src}`, done);
//       });
//     }

//     const files = await new Promise(done => {
//       exec(`find ${config.outdir} -type f`, (err,stdout, stderr) => {
//         done(stdout
//           .split('\n')
//           .map(file => file.slice(config.outdir.length))
//           .filter(file => file)
//         );
//       });
//     });
//     let sw = fs.readFileSync(`${config.outdir}/service-worker.js`, 'utf-8')
//       .split('"--FILES--"').join(JSON.stringify(['/',...files]));
//     fs.writeFileSync(`${config.outdir}/service-worker.js`, sw);
  })
