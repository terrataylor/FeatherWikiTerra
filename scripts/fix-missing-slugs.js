/**
 * Script to fix pages with missing slugs in FeatherWiki
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { compress, decompress } from '../helpers/jsonCompress.js';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');

async function fixMissingSlugs() {
  try {
    console.log('Reading wiki file...');
    const htmlContent = await readFile(wikiPath, 'utf8');
    
    // Extract the compressed data from the HTML
    const match = htmlContent.match(/<script id=p type=application\/json>(.*?)<\/script>/s);
    if (!match) {
      console.error('Could not find wiki data in HTML file!');
      process.exit(1);
    }
    
    const compressedData = match[1];
    console.log('Decompressing wiki data...');
    
    let wikiData = decompress(JSON.parse(compressedData));
    
    console.log(`Total pages: ${wikiData.pages.length}`);
    
    // Fix pages with missing slugs
    let fixedCount = 0;
    wikiData.pages = wikiData.pages.map(page => {
      if (!page.slug || page.slug === 'undefined') {
        // Generate slug from name or id
        const slugSource = page.name || page.id;
        page.slug = slugSource
          .toLowerCase()
          .replace(/\s/g, '_')
          .replace(/[\x00-\x2F\x3A-\x40[\\\]^`\x7B-\x7F]/g, '-');
        
        console.log(`  ✓ Fixed slug for: ${page.name} -> ${page.slug}`);
        fixedCount++;
      }
      return page;
    });
    
    if (fixedCount === 0) {
      console.log('\n✅ No missing slugs found - all pages are OK!');
      return;
    }
    
    console.log(`\n✅ Fixed ${fixedCount} pages with missing slugs.`);
    
    // Compress the data back
    console.log('Compressing wiki data...');
    const newCompressedData = JSON.stringify(compress(wikiData));
    
    // Replace the data in the HTML
    const newHtmlContent = htmlContent.replace(
      /<script id=p type=application\/json>.*?<\/script>/s,
      `<script id=p type=application/json>${newCompressedData}</script>`
    );
    
    // Write the updated HTML
    console.log('Writing updated wiki file...');
    await writeFile(wikiPath, newHtmlContent, 'utf8');
    
    console.log('\n✅ Successfully fixed all missing slugs!');
    console.log('🌐 Reload your browser to see the changes');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMissingSlugs();

