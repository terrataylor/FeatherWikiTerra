/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import path from 'path';
import fs from 'fs';
import http from 'http';
import esbuild from 'esbuild';

const outputDir = path.resolve(process.cwd(), 'develop');
const outputFilePath = path.resolve(outputDir, 'index.html');

esbuild.build({
  entryPoints: ['index.js'],
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.NODE_DEBUG': '"debug"',
  },
  sourcemap: 'inline',
  write: false,
  bundle: true,
  minify: false,
  // watch: {
  //   onRebuild(error, result) {
  //     if (error) console.error('watch build failed:', error)
  //     else {
  //       handleBuildResult(result)
  //         .catch((e) => {
  //           console.error(e);
  //           process.exit(1);
  //         });
  //     }
  //   },
  // },
  plugins: [],
  platform: 'browser',
  format: 'iife',
  target: [ 'es2015' ],
  outdir: 'build',
})
  .then(handleBuildResult)
  .then(startServer)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

async function handleBuildResult (result) {
  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');
  const cssResult = esbuild.buildSync({
    entryPoints: ['index.css'],
    write: false,
    bundle: true,
    minify: false,
    outdir: 'build',
  });
  for (const out of [...cssResult.outputFiles, ...result.outputFiles]) {
    let output = new TextDecoder().decode(out.contents);
    const outputKb = out.contents.byteLength * 0.000977;
    console.info(out.path, outputKb.toFixed(3) + ' kilobytes');
    if (/\.css$/.test(out.path)) {
      html = html.replace('{{cssOutput}}', output);
    } else if (/\.js$/.test(out.path)) {
      // Since there's regex stuff in here, I can't do replace!
      const htmlParts = html.split('{{jsOutput}}'); // But this does exactly what I need
      html = htmlParts[0] + output + htmlParts[1];
    }
  }
  
  return injectPackageJsonData(html);
}

async function injectPackageJsonData (html) {
  const fileName = path.relative(process.cwd(), 'package.json');
  const packageJsonFile = await fs.promises.readFile(fileName, 'utf8');
  const packageJson = JSON.parse(packageJsonFile);

  const matches = html.match(/(?<={{)package\.json:.+?(?=}})/g);

  if (matches?.length > 0) {
    let result = html;
    matches.map(match => {
      const value = match.replace('package.json:', '').trim();
      const replace = value.split('.').reduce((result, current) => {
        if (result === null) {
          return packageJson[current] ?? '';
        }
        return result[current] ?? '';
      }, null);
      return {
        match: `{{${match}}}`,
        replace,
      };
    }).forEach(m => {
      html = html.replace(m.match, m.replace);
    });
  }

  return localizeHtml(html);
}

async function localizeHtml(html) {
  // Load English locale for development
  const localesFilePath = path.resolve(process.cwd(), 'locales');
  const englishFilePath = path.resolve(localesFilePath, 'en-US.json');
  const englishFile = await fs.promises.readFile(englishFilePath, 'utf-8');
  const english = JSON.parse(englishFile);
  
  const localeName = 'en-US';
  html = html.replace(/\{\{localeName\}\}/g, localeName);

  // Replace translation placeholders
  Object.keys(english).forEach(key => {
    const regex = new RegExp('\\{\\{translate: ?' + key + '\\}\\}', 'g');
    let translation = (english[key] ?? '').replace(/(['"])/g, '\\$1'); // Escape quotes
    if (key === 'javascriptRequired') {
      translation = `<a href="https://src.feather.wiki/#browser-compatibility">${translation}</a>`;
    }
    html = html.replace(regex, translation);
  });

  return writeHtmlOutput(html);
}

async function writeHtmlOutput (html) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await fs.writeFile(outputFilePath, html, (err) => {
    if (err) throw err;
    const outputKb = Uint8Array.from(Buffer.from(html)).byteLength * 0.000977;
    console.info(outputFilePath, outputKb.toFixed(3) + ' kilobytes');
  });
}

async function startServer () {
  const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
  
    res.end(fs.readFileSync(outputFilePath));
  });
  server.listen(3000, 'localhost');
  console.log('Node server running at http://localhost:3000');
}
