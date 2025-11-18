import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');

async function injectFactChecker() {
  try {
    console.log('Reading wiki file...');
    let content = await readFile(wikiPath, 'utf8');
    
    // Check if already injected
    if (content.includes('factCheckBtn')) {
      console.log('⚠️  Fact-checker already installed!');
      return;
    }
    
    console.log('Injecting fact-checker...');
    
    // The actual fact checker code - inline in the HTML before </body>
    const factCheckerScript = `<script>
(function() {
  FW.ready(function() {
    FW.emitter.on('render', function() {
      if (FW.state.edit || !FW.state.pg || FW.state.pg.e) return;
      if (document.querySelector('#factCheckBtn')) return;
      
      var article = document.querySelector('article.uc');
      if (!article) return;
      
      var button = document.createElement('button');
      button.id = 'factCheckBtn';
      button.textContent = '🔍 Fact Check This Page';
      button.style.cssText = 'margin:1rem 0;padding:0.5rem 1rem;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;';
      button.onclick = function() { runFactCheck(); };
      
      article.parentElement.insertBefore(button, article);
      
      var resultsDiv = document.createElement('div');
      resultsDiv.id = 'factCheckResults';
      resultsDiv.style.cssText = 'display:none;margin:1rem 0;padding:1rem;border:2px solid #007bff;border-radius:4px;background:#f8f9fa;';
      resultsDiv.innerHTML = '<h3 style="margin-top:0;">Fact Check Results</h3><div id="factCheckContent"></div>';
      article.parentElement.insertBefore(resultsDiv, article);
    });
    
    window.runFactCheck = async function() {
      var button = document.querySelector('#factCheckBtn');
      var resultsPanel = document.querySelector('#factCheckResults');
      var resultsContent = document.querySelector('#factCheckContent');
      
      if (!button || !resultsPanel || !resultsContent) return;
      
      button.textContent = '⏳ Checking facts...';
      button.disabled = true;
      resultsPanel.style.display = 'block';
      resultsContent.innerHTML = '<p>Analyzing content...</p>';
      
      try {
        var content = FW.state.pg.content || '';
        var textContent = content;
        
        if (FW.state.pg.editor === 'md' && typeof md !== 'undefined') {
          textContent = md(content);
        }
        
        var temp = document.createElement('div');
        temp.innerHTML = textContent;
        textContent = temp.textContent || temp.innerText || '';
        
        var claims = extractClaims(textContent);
        
        if (claims.length === 0) {
          resultsContent.innerHTML = '<p>No factual claims detected.</p>';
          button.textContent = '✅ Complete';
          button.disabled = false;
          return;
        }
        
        resultsContent.innerHTML = '<p>Found ' + claims.length + ' claims. Checking Wikipedia...</p>';
        
        var results = await checkWithWikipedia(claims);
        displayResults(results, resultsContent);
        
        button.textContent = '🔍 Fact Check This Page';
        button.disabled = false;
      } catch (error) {
        console.error('Error:', error);
        resultsContent.innerHTML = '<p style="color:red;">Error: ' + error.message + '</p>';
        button.textContent = '❌ Error';
        button.disabled = false;
      }
    };
    
    function extractClaims(text) {
      var claims = [];
      var sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      
      for (var i = 0; i < sentences.length; i++) {
        var sentence = sentences[i];
        var trimmed = sentence.trim();
        if (trimmed.length < 10) continue;
        
        var score = 0;
        if (/\\d+/.test(trimmed)) score++;
        if (/\\d{4}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(trimmed)) score++;
        if (/\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\b/.test(trimmed)) score++;
        if (/\\b\\d+%|\\$\\d+|approximately|about|nearly|over\\s+\\d+/i.test(trimmed)) score += 2;
        if (/\\b(is|are|was|were|has|have|had|will|can|cannot|must)\\b/i.test(trimmed)) score++;
        
        if (score >= 2) {
          claims.push({ text: trimmed, index: i, score: score });
        }
      }
      
      return claims;
    }
    
    async function checkWithWikipedia(claims) {
      var results = [];
      
      for (var i = 0; i < claims.length; i++) {
        var claim = claims[i];
        try {
          var keyTerms = extractKeyTerms(claim.text);
          var searchQuery = keyTerms.join(' ');
          
          var searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=' + 
            encodeURIComponent(searchQuery) + '&srlimit=3&origin=*';
          
          var searchResponse = await fetch(searchUrl);
          var searchData = await searchResponse.json();
          
          if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            results.push({
              claim: claim.text,
              status: 'review',
              explanation: 'No Wikipedia articles found.',
              sources: []
            });
            continue;
          }
          
          var topResult = searchData.query.search[0];
          var pageTitle = topResult.title;
          
          var extractUrl = 'https://en.wikipedia.org/w/api.php?action=query&format=json&titles=' + 
            encodeURIComponent(pageTitle) + '&prop=extracts|info&exintro=1&explaintext=1&inprop=url&origin=*';
          
          var extractResponse = await fetch(extractUrl);
          var extractData = await extractResponse.json();
          
          var pages = extractData.query.pages;
          var pageId = Object.keys(pages)[0];
          var page = pages[pageId];
          var extract = page.extract || '';
          
          var claimNumbers = claim.text.match(/\\d+/g) || [];
          var extractNumbers = extract.match(/\\d+/g) || [];
          var hasMatchingNumbers = false;
          for (var j = 0; j < claimNumbers.length; j++) {
            if (extractNumbers.indexOf(claimNumbers[j]) !== -1) {
              hasMatchingNumbers = true;
              break;
            }
          }
          
          var relevance = calculateRelevance(claim.text, extract);
          var status = (relevance > 0.5 || hasMatchingNumbers) ? 'verified' : 'questionable';
          
          results.push({
            claim: claim.text,
            status: status,
            explanation: 'Wikipedia: "' + pageTitle + '". ' + extract.substring(0, 200) + '...',
            sources: [{
              title: pageTitle,
              url: page.fullurl || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(pageTitle)
            }]
          });
          
        } catch (error) {
          results.push({
            claim: claim.text,
            status: 'error',
            explanation: 'Error: ' + error.message,
            sources: []
          });
        }
      }
      
      return results;
    }
    
    function extractKeyTerms(text) {
      var words = text.split(/\\s+/);
      var keyTerms = [];
      
      for (var i = 0; i < words.length; i++) {
        if (/^[A-Z][a-z]+/.test(words[i])) {
          keyTerms.push(words[i]);
        }
      }
      
      var numbers = text.match(/\\d+(?:\\.\\d+)?%?/g) || [];
      for (var i = 0; i < numbers.length; i++) {
        keyTerms.push(numbers[i]);
      }
      
      var unique = [];
      for (var i = 0; i < keyTerms.length; i++) {
        if (unique.indexOf(keyTerms[i]) === -1) {
          unique.push(keyTerms[i]);
        }
      }
      
      return unique.slice(0, 5);
    }
    
    function calculateRelevance(claim, wikiText) {
      var claimWords = claim.toLowerCase().split(/\\s+/).filter(function(w) { return w.length > 3; });
      var wikiWords = wikiText.toLowerCase().split(/\\s+/);
      
      var matches = 0;
      for (var i = 0; i < claimWords.length; i++) {
        for (var j = 0; j < wikiWords.length; j++) {
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
        container.innerHTML = '<p>No claims found.</p>';
        return;
      }
      
      var html = '<p><strong>Found ' + results.length + ' claim(s):</strong></p>';
      
      for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var statusColor = result.status === 'verified' ? '#d4edda' : 
                         result.status === 'questionable' ? '#f8d7da' : '#fff3cd';
        var statusIcon = result.status === 'verified' ? '✅' : 
                        result.status === 'questionable' ? '⚠️' : '🔍';
        var borderColor = result.status === 'verified' ? '#28a745' : 
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
          for (var j = 0; j < result.sources.length; j++) {
            var source = result.sources[j];
            html += '<li><a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.title + '</a></li>';
          }
          html += '</ul></div>';
        }
        
        html += '</div>';
      }
      
      html += '<div style="margin-top:1rem;padding:0.75rem;background:#e7f3ff;border-radius:4px;">';
      html += '<p style="margin:0;font-size:0.9em;"><strong>💡 Note:</strong> Checks against Wikipedia. ';
      html += 'Green = verified, Yellow = review, Red = questionable.</p></div>';
      
      container.innerHTML = html;
    }
  });
})();
</script>`;
    
    // Inject before </body>
    content = content.replace('</body>', factCheckerScript + '\n</body>');
    
    console.log('Writing updated wiki...');
    await writeFile(wikiPath, content, 'utf8');
    
    console.log('\n✅ Fact-checker installed!');
    console.log('🌐 Refresh http://localhost:4505 (Ctrl+Shift+R)');
    console.log('📋 You should see the button on every page!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

injectFactChecker();




