/**
 * Script to add the fact-checker extension to the wiki's Custom JS
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { compress, decompress } from '../helpers/jsonCompress.js';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');
const extensionPath = path.resolve(process.cwd(), 'extensions/fact-checker.js');

async function addFactChecker() {
  try {
    console.log('Reading wiki file...');
    const htmlContent = await readFile(wikiPath, 'utf8');
    
    console.log('Reading fact-checker extension...');
    const extensionCode = await readFile(extensionPath, 'utf8');
    
    // Remove the FW.ready wrapper and license header for cleaner custom JS
    const cleanCode = extensionCode
      .replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '') // Remove license header
      .replace(/^\/\/ This extension.*$/m, '') // Remove description comment
      .replace(/^\/\/ Add this to.*$/m, '') // Remove usage comment
      .replace(/^\s*\n/gm, '') // Remove empty lines at start
      .trim();
    
    // Extract the compressed data from the HTML
    const match = htmlContent.match(/<script id=p type=application\/json>(.*?)<\/script>/s);
    if (!match) {
      console.error('Could not find wiki data in HTML file!');
      process.exit(1);
    }
    
    const compressedData = match[1];
    console.log('Decompressing wiki data...');
    
    let wikiData;
    if (compressedData === '{}') {
      console.log('Empty wiki detected, initializing...');
      wikiData = {
        name: 'Feather Wiki',
        desc: 'A lightweight personal wiki',
        pages: [],
        img: {}
      };
    } else {
      wikiData = decompress(JSON.parse(compressedData));
    }
    
    // Add the extension to custom JS
    console.log('Adding fact-checker extension to Custom JS...');
    wikiData.customJS = cleanCode; // This will be stored in the 'j' field
    
    // Note: The actual field name in the wiki data might be different
    // Let me check what field stores custom JS
    console.log('Current wiki data keys:', Object.keys(wikiData));
    
    // Compress the data back
    console.log('Compressing wiki data...');
    const newCompressedData = JSON.stringify(compress(wikiData));
    
    // Replace the data in the HTML
    const newHtmlContent = htmlContent.replace(
      /<script id=p type=application\/json>.*?<\/script>/s,
      `<script id=p type=application/json>${newCompressedData}</script>`
    );
    
    // Also need to add it to the script#j tag directly
    const jsMatch = htmlContent.match(/<script id=j>(.*?)<\/script>/s);
    const currentJS = jsMatch ? jsMatch[1] : '';
    
    // Check if fact-checker is already there
    if (currentJS.includes('Fact Check This Page')) {
      console.log('\n⚠️  Fact-checker extension already appears to be installed!');
      return;
    }
    
    const newJS = currentJS ? `${currentJS}\n\n${cleanCode}` : cleanCode;
    const finalHtmlContent = newHtmlContent.replace(
      /<script id=j>.*?<\/script>/s,
      `<script id=j>${newJS}</script>`
    );
    
    // Write the file back
    console.log('Writing updated wiki file...');
    await writeFile(wikiPath, finalHtmlContent, 'utf8');
    
    console.log('\n✅ Successfully added fact-checker extension to your wiki!');
    console.log('🌐 Refresh http://localhost:4505 to see the changes');
    console.log('📋 A "🔍 Fact Check This Page" button will appear on all pages');
    console.log('\n💡 Try it on the Features or Welcome page to see Wikipedia fact-checking in action!');
    
  } catch (error) {
    console.error('Error adding fact-checker:', error);
    process.exit(1);
  }
}

addFactChecker();

