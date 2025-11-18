import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { compress, decompress } from '../helpers/jsonCompress.js';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');

const factCheckerCode = `// Fact-Checker Extension
(function() {
  const state = FW.state;
  const emitter = FW.emitter;
  
  emitter.on('render', function() {
    if (state.edit || !state.pg || state.pg.e) return;
    if (document.querySelector('#factCheckBtn')) return;
    
    const article = document.querySelector('article.uc');
    if (!article) return;
    
    const button = document.createElement('button');
    button.id = 'factCheckBtn';
    button.textContent = '🔍 Fact Check This Page';
    button.style.cssText = 'margin:1rem 0;padding:0.5rem 1rem;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;';
    button.onclick = runFactCheck;
    
    article.parentElement.insertBefore(button, article);
    
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'factCheckResults';
    resultsDiv.style.cssText = 'display:none;margin:1rem 0;padding:1rem;border:2px solid #007bff;border-radius:4px;background:#f8f9fa;';
    resultsDiv.innerHTML = '<h3 style="margin-top:0;">Fact Check Results</h3><div id="factCheckContent"></div>';
    article.parentElement.insertBefore(resultsDiv, article);
  });

  async function runFactCheck() {
    const button = document.querySelector('#factCheckBtn');
    const resultsPanel = document.querySelector('#factCheckResults');
    const resultsContent = document.querySelector('#factCheckContent');
    
    if (!button || !resultsPanel || !resultsContent) return;
    
    button.textContent = '⏳ Checking facts...';
    button.disabled = true;
    resultsPanel.style.display = 'block';
    resultsContent.innerHTML = '<p>Analyzing content for factual claims...</p>';
    
    try {
      const content = state.pg.content || '';
      let textContent = content;
      
      if (state.pg.editor === 'md' && typeof md !== 'undefined') {
        textContent = md(content);
      }
      
      const temp = document.createElement('div');
      temp.innerHTML = textContent;
      textContent = temp.textContent || temp.innerText || '';
      
      const claims = extractClaims(textContent);
      
      if (claims.length === 0) {
        resultsContent.innerHTML = '<p>No specific factual claims detected in this page.</p>';
        button.textContent = '✅ Fact Check Complete';
        button.disabled = false;
        return;
      }
      
      resultsContent.innerHTML = '<p>Found ' + claims.length + ' claims. Checking against Wikipedia...</p>';
      
      const results = await checkWithWikipedia(claims);
      displayResults(results, resultsContent);
      
      button.textContent = '🔍 Fact Check This Page';
      button.disabled = false;
    } catch (error) {
      console.error('Fact check error:', error);
      resultsContent.innerHTML = '<p style="color:red;">Error: ' + error.message + '</p>';
      button.textContent = '❌ Error - Try Again';
      button.disabled = false;
    }
  }

  function extractClaims(text) {
    const claims = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    sentences.forEach(function(sentence, index) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) return;
      
      let score = 0;
      if (/\\d+/.test(trimmed)) score++;
      if (/\\d{4}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(trimmed)) score++;
      if (/\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\b/.test(trimmed)) score++;
      if (/\\b\\d+%|\\$\\d+|approximately|about|nearly|over\\s+\\d+/i.test(trimmed)) score += 2;
      if (/\\b(is|are|was|were|has|have|had|will|can|cannot|must)\\b/i.test(trimmed)) score++;
      
      if (score >= 2) {
        claims.push({
          text: trimmed,
          index: index,
          score: score
        });
      }
    });
    
    return claims;
  }

  async function checkWithWikipedia(claims) {
    const results = [];
    
    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      try {
        const keyTerms = extractKeyTerms(claim.text);
        const searchQuery = keyTerms.join(' ');
        
        const searchUrl = 'https://en.wikipedia.org/w/api.php?' +
          'action=query&format=json&list=search&' +
          'srsearch=' + encodeURIComponent(searchQuery) +
          '&srlimit=3&origin=*';
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
          results.push({
            claim: claim.text,
            status: 'review',
            explanation: 'No Wikipedia articles found. May need manual verification.',
            sources: []
          });
          continue;
        }
        
        const topResult = searchData.query.search[0];
        const pageTitle = topResult.title;
        
        const extractUrl = 'https://en.wikipedia.org/w/api.php?' +
          'action=query&format=json&' +
          'titles=' + encodeURIComponent(pageTitle) +
          '&prop=extracts|info&exintro=1&explaintext=1&inprop=url&origin=*';
        
        const extractResponse = await fetch(extractUrl);
        const extractData = await extractResponse.json();
        
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        const extract = page.extract || '';
        
        const claimNumbers = claim.text.match(/\\d+/g) || [];
        const extractNumbers = extract.match(/\\d+/g) || [];
        const hasMatchingNumbers = claimNumbers.some(function(num) {
          return extractNumbers.indexOf(num) !== -1;
        });
        
        const relevance = calculateRelevance(claim.text, extract);
        const status = (relevance > 0.5 || hasMatchingNumbers) ? 'verified' : 'questionable';
        
        results.push({
          claim: claim.text,
          status: status,
          explanation: 'Wikipedia article: "' + pageTitle + '". ' + extract.substring(0, 200) + '...',
          sources: [{
            title: pageTitle,
            url: page.fullurl || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(pageTitle),
            snippet: extract.substring(0, 300)
          }]
        });
        
      } catch (error) {
        console.error('Wikipedia check error:', error);
        results.push({
          claim: claim.text,
          status: 'error',
          explanation: 'Error checking: ' + error.message,
          sources: []
        });
      }
    }
    
    return results;
  }

  function extractKeyTerms(text) {
    const words = text.split(/\\s+/);
    const keyTerms = [];
    
    for (let i = 0; i < words.length; i++) {
      if (/^[A-Z][a-z]+/.test(words[i])) {
        keyTerms.push(words[i]);
      }
    }
    
    const numbers = text.match(/\\d+(?:\\.\\d+)?%?/g) || [];
    keyTerms.push.apply(keyTerms, numbers);
    
    const unique = [];
    for (let i = 0; i < keyTerms.length; i++) {
      if (unique.indexOf(keyTerms[i]) === -1) {
        unique.push(keyTerms[i]);
      }
    }
    
    return unique.slice(0, 5);
  }

  function calculateRelevance(claim, wikiText) {
    const claimWords = claim.toLowerCase().split(/\\s+/).filter(function(w) { return w.length > 3; });
    const wikiWords = wikiText.toLowerCase().split(/\\s+/);
    
    let matches = 0;
    for (let i = 0; i < claimWords.length; i++) {
      for (let j = 0; j < wikiWords.length; j++) {
        if (wikiWords[j].indexOf(claimWords[i]) !== -1 || claimWords[i].indexOf(wikiWords[j]) !== -1) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(claimWords.length, 1);
  }

  function displayResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = '<p>No fact-checkable claims found.</p>';
      return;
    }
    
    let html = '<p><strong>Found ' + results.length + ' factual claim(s):</strong></p>';
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const statusColor = result.status === 'verified' ? '#d4edda' : 
                         result.status === 'questionable' ? '#f8d7da' : '#fff3cd';
      const statusIcon = result.status === 'verified' ? '✅' : 
                        result.status === 'questionable' ? '⚠️' : '🔍';
      const borderColor = result.status === 'verified' ? '#28a745' : 
                         result.status === 'questionable' ? '#dc3545' : '#ffc107';
      
      html += '<div style="margin:1rem 0;padding:0.75rem;background:' + statusColor + 
              ';border-radius:4px;border-left:4px solid ' + borderColor + ';">';
      html += '<p style="margin:0 0 0.5rem 0;"><strong>' + statusIcon + ' Claim ' + (i + 1) + ':</strong></p>';
      html += '<p style="margin:0 0 0.5rem 0;font-style:italic;">"' + result.claim + '"</p>';
      
      if (result.explanation) {
        html += '<p style="margin:0.5rem 0;font-size:0.9em;"><strong>Analysis:</strong> ' + result.explanation + '</p>';
      }
      
      if (result.sources && result.sources.length > 0) {
        html += '<div style="margin:0.5rem 0;font-size:0.9em;"><strong>Sources:</strong><ul style="margin:0.25rem 0;padding-left:1.5rem;">';
        for (let j = 0; j < result.sources.length; j++) {
          const source = result.sources[j];
          html += '<li><a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.title + '</a></li>';
        }
        html += '</ul></div>';
      }
      
      html += '<p style="margin:0.5rem 0 0 0;"><a href="https://www.google.com/search?q=' + 
              encodeURIComponent(result.claim) + '" target="_blank" rel="noopener noreferrer" style="font-size:0.9em;">🔗 Search Google</a></p>';
      html += '</div>';
    }
    
    html += '<div style="margin-top:1rem;padding:0.75rem;background:#e7f3ff;border-radius:4px;">';
    html += '<p style="margin:0;font-size:0.9em;"><strong>💡 Note:</strong> This fact-checker uses Wikipedia API to verify claims. ';
    html += 'Green = likely accurate, Yellow = needs review, Red = questionable. Always verify important facts!</p></div>';
    
    container.innerHTML = html;
  }
})();`;

async function addFactChecker() {
  try {
    console.log('Reading wiki file...');
    const htmlContent = await readFile(wikiPath, 'utf8');
    
    // Extract the wiki data
    const match = htmlContent.match(/<script id=p type=application\/json>(.*?)<\/script>/s);
    if (!match) {
      console.error('Could not find wiki data!');
      process.exit(1);
    }
    
    const compressedData = match[1];
    console.log('Decompressing wiki data...');
    
    let wikiData;
    if (compressedData === '{}') {
      wikiData = { name: 'Feather Wiki', desc: '', pages: [], img: {} };
    } else {
      wikiData = decompress(JSON.parse(compressedData));
    }
    
    console.log('Adding fact-checker to Custom JS...');
    
    // Add the fact checker to custom JS
    wikiData.customJS = factCheckerCode;
    
    // Compress the data back
    const newCompressedData = JSON.stringify(compress(wikiData));
    
    // Replace the data in the HTML
    let newHtmlContent = htmlContent.replace(
      /<script id=p type=application\/json>.*?<\/script>/s,
      `<script id=p type=application/json>${newCompressedData}</script>`
    );
    
    // Now we need to inject the script tag for custom JS
    // The format should be: <script id=j>FW.ready(()=>{/**/CODE/**/});</script>
    const wrappedCode = `FW.ready(()=>{/**/${factCheckerCode}/**/});`;
    
    // Check if script#j exists and replace/add it
    if (newHtmlContent.includes('<script id=j>')) {
      // Replace existing
      newHtmlContent = newHtmlContent.replace(
        /<script id=j>.*?<\/script>/s,
        `<script id=j>${wrappedCode}</script>`
      );
    } else {
      // Add before </body>
      newHtmlContent = newHtmlContent.replace(
        '</body>',
        `<script id=j>${wrappedCode}</script>\n</body>`
      );
    }
    
    console.log('Writing updated wiki...');
    await writeFile(wikiPath, newHtmlContent, 'utf8');
    
    console.log('\n✅ Fact-checker successfully installed!');
    console.log('🌐 Refresh http://localhost:4505');
    console.log('📋 You should now see a "🔍 Fact Check This Page" button on every page!');
    console.log('\n🎯 Test it on the animal pages to catch false information!');
    
  } catch (error) {
    console.error('Error installing fact-checker:', error);
    process.exit(1);
  }
}

addFactChecker();

