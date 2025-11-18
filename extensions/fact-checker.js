/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds fact-checking functionality to pages. It analyzes content for factual claims,
// highlights verifiable statements, and optionally checks them against web sources.
// Add this to your Custom JS in Wiki Settings or load it as an external script.

FW.ready(() => {
  const { state, emitter } = FW;
  
  // Configuration - you can change these
  const config = {
    useWikipedia: true, // Use Wikipedia API for fact checking (free, no API key needed!)
    useWikidata: false, // Alternative: use Wikidata for structured data
    highlightColor: '#fff3cd', // Yellow highlight for claims
    successColor: '#d4edda', // Green for verified
    warningColor: '#f8d7da', // Red for questionable
    minRelevanceScore: 0.3, // Minimum relevance score to consider a Wikipedia article
  };

  // State for fact check results
  state.factCheckResults = null;
  state.factCheckPanel = null;

  // Add fact check button after each render
  emitter.on('render', () => {
    addFactCheckButton();
  });

  function addFactCheckButton() {
    // Only show on page view (not edit mode)
    if (state.edit || !state.pg || state.pg.e) return;

    // Check if button already exists
    if (document.querySelector('#factCheckBtn')) return;

    // Find the article content area
    const article = document.querySelector('article.uc');
    if (!article) return;

    // Create fact check button
    const button = html`<button 
      id="factCheckBtn" 
      style="margin: 1rem 0; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
      onclick=${() => runFactCheck()}>
      🔍 Fact Check This Page
    </button>`;

    // Insert button before the article
    article.parentElement.insertBefore(button, article);

    // Create results panel (hidden by default)
    if (!state.factCheckPanel) {
      state.factCheckPanel = html`<div 
        id="factCheckResults" 
        style="display: none; margin: 1rem 0; padding: 1rem; border: 2px solid #007bff; border-radius: 4px; background: #f8f9fa;">
        <h3 style="margin-top: 0;">Fact Check Results</h3>
        <div id="factCheckContent"></div>
      </div>`;
      article.parentElement.insertBefore(state.factCheckPanel, article);
    }
  }

  async function runFactCheck() {
    const button = document.querySelector('#factCheckBtn');
    const resultsPanel = document.querySelector('#factCheckResults');
    const resultsContent = document.querySelector('#factCheckContent');

    if (!button || !resultsPanel || !resultsContent) return;

    // Show loading state
    button.textContent = '⏳ Checking facts...';
    button.disabled = true;
    resultsPanel.style.display = 'block';
    resultsContent.innerHTML = '<p>Analyzing content...</p>';

    try {
      // Get the current page content
      const content = state.pg.content || '';
      const textContent = extractTextContent(content, state.pg.editor);

      // Extract factual claims
      const claims = extractClaims(textContent);

      if (claims.length === 0) {
        resultsContent.innerHTML = '<p>No specific factual claims detected. This page appears to contain primarily subjective or general content.</p>';
        button.textContent = '✅ Fact Check Complete';
        button.disabled = false;
        return;
      }

      // Check facts using Wikipedia or locally
      let results;
      if (config.useWikipedia) {
        results = await checkFactsWithWikipedia(claims);
      } else if (config.useWikidata) {
        results = await checkFactsWithWikidata(claims);
      } else {
        results = checkFactsLocally(claims);
      }

      // Display results
      displayResults(results, resultsContent);

      button.textContent = '🔍 Fact Check This Page';
      button.disabled = false;
    } catch (error) {
      console.error('Fact check error:', error);
      resultsContent.innerHTML = `<p style="color: red;">Error during fact check: ${error.message}</p>`;
      button.textContent = '❌ Error - Try Again';
      button.disabled = false;
    }
  }

  function extractTextContent(content, editor) {
    // Convert markdown to HTML if needed
    let htmlContent = content;
    if (editor === 'md' && typeof md !== 'undefined') {
      htmlContent = md(content);
    }

    // Process internal wiki markup
    htmlContent = FW.inject.pg(htmlContent);
    
    // Create temp element to extract text
    const temp = html`<div></div>`;
    temp.innerHTML = htmlContent;
    return temp.textContent || temp.innerText || '';
  }

  function extractClaims(text) {
    const claims = [];

    // Extract sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      
      // Look for factual indicators
      const hasNumber = /\d+/.test(trimmed);
      const hasDate = /\d{4}|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(trimmed);
      const hasProperNoun = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(trimmed);
      const hasStatistic = /\b\d+%|\$\d+|approximately|about|nearly|over\s+\d+/i.test(trimmed);
      const hasDefinitiveStatement = /\b(is|are|was|were|has|have|had|will|can|cannot|must)\b/i.test(trimmed);

      // Score the claim based on factual indicators
      let score = 0;
      if (hasNumber) score++;
      if (hasDate) score++;
      if (hasProperNoun) score++;
      if (hasStatistic) score += 2;
      if (hasDefinitiveStatement) score++;

      // Consider it a factual claim if score is high enough
      if (score >= 2) {
        claims.push({
          text: trimmed,
          index,
          hasNumber,
          hasDate,
          hasProperNoun,
          hasStatistic,
          score
        });
      }
    });

    return claims;
  }

  function checkFactsLocally(claims) {
    // Local fact checking - provides guidance for manual verification
    return claims.map(claim => {
      const suggestions = [];
      
      if (claim.hasDate) {
        suggestions.push('Verify the date is accurate and in correct historical context');
      }
      if (claim.hasStatistic || claim.hasNumber) {
        suggestions.push('Check if numerical data is current and from reliable sources');
      }
      if (claim.hasProperNoun) {
        suggestions.push('Verify proper nouns (names, places, organizations) are spelled correctly');
      }

      // Generate search suggestions
      const searchTerms = extractKeyTerms(claim.text);
      suggestions.push(`Search terms: ${searchTerms.join(', ')}`);

      return {
        claim: claim.text,
        status: 'review', // 'verified', 'questionable', 'review'
        confidence: claim.score >= 4 ? 'high' : claim.score >= 2 ? 'medium' : 'low',
        suggestions,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
      };
    });
  }

  async function checkFactsWithWikipedia(claims) {
    // Use Wikipedia API for fact checking (free, no API key needed!)
    const results = [];
    
    for (const claim of claims) {
      try {
        // Extract key terms from the claim
        const keyTerms = extractKeyTerms(claim.text);
        const searchQuery = keyTerms.join(' ');

        // Search Wikipedia
        const searchUrl = `https://en.wikipedia.org/w/api.php?` +
          `action=query&` +
          `format=json&` +
          `list=search&` +
          `srsearch=${encodeURIComponent(searchQuery)}&` +
          `srlimit=3&` +
          `origin=*`;

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
          results.push({
            claim: claim.text,
            status: 'review',
            confidence: 'low',
            explanation: 'No Wikipedia articles found for this claim. Consider manual verification.',
            sources: [],
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
          });
          continue;
        }

        // Get the top result
        const topResult = searchData.query.search[0];
        const pageTitle = topResult.title;

        // Get article extract
        const extractUrl = `https://en.wikipedia.org/w/api.php?` +
          `action=query&` +
          `format=json&` +
          `titles=${encodeURIComponent(pageTitle)}&` +
          `prop=extracts|info&` +
          `exintro=1&` +
          `explaintext=1&` +
          `inprop=url&` +
          `origin=*`;

        const extractResponse = await fetch(extractUrl);
        const extractData = await extractResponse.json();

        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        // Analyze relevance
        const extract = page.extract || '';
        const relevance = calculateRelevance(claim.text, extract);
        
        // Check if numbers/dates match
        const claimNumbers = claim.text.match(/\d+/g) || [];
        const extractNumbers = extract.match(/\d+/g) || [];
        const hasMatchingNumbers = claimNumbers.some(num => extractNumbers.includes(num));

        const status = relevance > 0.5 || hasMatchingNumbers ? 'verified' : 'review';
        const confidence = relevance > 0.7 ? 'high' : relevance > 0.4 ? 'medium' : 'low';

        results.push({
          claim: claim.text,
          status: status,
          confidence: confidence,
          explanation: `Found Wikipedia article: "${pageTitle}". ${extract.substring(0, 200)}...`,
          sources: [{
            title: pageTitle,
            url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
            snippet: extract.substring(0, 300)
          }],
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
        });

      } catch (error) {
        console.error('Wikipedia API error:', error);
        results.push({
          claim: claim.text,
          status: 'review',
          confidence: 'low',
          explanation: `Error checking Wikipedia: ${error.message}. Please verify manually.`,
          sources: [],
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
        });
      }
    }

    return results;
  }

  async function checkFactsWithWikidata(claims) {
    // Use Wikidata SPARQL for structured fact checking
    const results = [];
    
    for (const claim of claims) {
      try {
        const keyTerms = extractKeyTerms(claim.text);
        const searchQuery = keyTerms.join(' ');

        // Search Wikidata
        const searchUrl = `https://www.wikidata.org/w/api.php?` +
          `action=wbsearchentities&` +
          `format=json&` +
          `language=en&` +
          `search=${encodeURIComponent(searchQuery)}&` +
          `limit=3&` +
          `origin=*`;

        const response = await fetch(searchUrl);
        const data = await response.json();

        if (!data.search || data.search.length === 0) {
          results.push({
            claim: claim.text,
            status: 'review',
            confidence: 'low',
            explanation: 'No Wikidata entries found. Consider checking Wikipedia or other sources.',
            sources: [],
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
          });
          continue;
        }

        const topEntity = data.search[0];
        const entityUrl = `https://www.wikidata.org/wiki/${topEntity.id}`;

        results.push({
          claim: claim.text,
          status: 'review',
          confidence: 'medium',
          explanation: `Found Wikidata entity: "${topEntity.label}". ${topEntity.description || ''}`,
          sources: [{
            title: topEntity.label,
            url: entityUrl,
            snippet: topEntity.description || 'No description available'
          }],
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
        });

      } catch (error) {
        console.error('Wikidata API error:', error);
        results.push({
          claim: claim.text,
          status: 'review',
          confidence: 'low',
          explanation: `Error checking Wikidata: ${error.message}`,
          sources: [],
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(claim.text)}`
        });
      }
    }

    return results;
  }

  function calculateRelevance(claim, wikiText) {
    // Simple relevance scoring based on term overlap
    const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wikiWords = wikiText.toLowerCase().split(/\s+/);
    
    let matches = 0;
    claimWords.forEach(word => {
      if (wikiWords.some(w => w.includes(word) || word.includes(w))) {
        matches++;
      }
    });

    return matches / Math.max(claimWords.length, 1);
  }

  function extractKeyTerms(text) {
    // Extract potentially important terms for searching
    const words = text.split(/\s+/);
    const keyTerms = [];

    // Get proper nouns (capitalized words)
    const properNouns = words.filter(w => /^[A-Z][a-z]+/.test(w));
    keyTerms.push(...properNouns);

    // Get numbers and dates
    const numbers = text.match(/\d+(?:\.\d+)?%?/g) || [];
    keyTerms.push(...numbers);

    // Remove duplicates and limit
    return [...new Set(keyTerms)].slice(0, 5);
  }

  function displayResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = '<p>No fact-checkable claims found.</p>';
      return;
    }

    const resultHtml = html`<div>
      <p><strong>Found ${results.length} factual claim(s) to review:</strong></p>
      ${results.map((result, index) => {
        const statusColor = 
          result.status === 'verified' ? config.successColor :
          result.status === 'questionable' ? config.warningColor :
          config.highlightColor;

        const statusIcon =
          result.status === 'verified' ? '✅' :
          result.status === 'questionable' ? '⚠️' :
          result.status === 'error' ? '❌' :
          '🔍';

        return html`<div style="margin: 1rem 0; padding: 0.75rem; background: ${statusColor}; border-radius: 4px; border-left: 4px solid ${result.status === 'verified' ? '#28a745' : result.status === 'questionable' ? '#dc3545' : '#ffc107'};">
          <p style="margin: 0 0 0.5rem 0;"><strong>${statusIcon} Claim ${index + 1}:</strong></p>
          <p style="margin: 0 0 0.5rem 0; font-style: italic;">"${result.claim}"</p>
          
          ${result.explanation ? html`<p style="margin: 0.5rem 0; font-size: 0.9em;"><strong>Analysis:</strong> ${result.explanation}</p>` : ''}
          
          ${result.suggestions ? html`<div style="margin: 0.5rem 0; font-size: 0.9em;">
            <strong>Verification steps:</strong>
            <ul style="margin: 0.25rem 0; padding-left: 1.5rem;">
              ${result.suggestions.map(s => html`<li>${s}</li>`)}
            </ul>
          </div>` : ''}
          
          ${result.sources && result.sources.length > 0 ? html`<div style="margin: 0.5rem 0; font-size: 0.9em;">
            <strong>Sources:</strong>
            <ul style="margin: 0.25rem 0; padding-left: 1.5rem;">
              ${result.sources.map(s => html`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a></li>`)}
            </ul>
          </div>` : ''}
          
          <p style="margin: 0.5rem 0 0 0;">
            <a href="${result.searchUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.9em;">🔗 Search for verification</a>
          </p>
        </div>`;
      })}
      
      <div style="margin-top: 1rem; padding: 0.75rem; background: #e7f3ff; border-radius: 4px;">
        <p style="margin: 0; font-size: 0.9em;">
          <strong>💡 Note:</strong> This fact-checker highlights claims that may need verification. 
          Always verify important facts with reliable sources. The system identifies:
          dates, statistics, proper nouns, and definitive statements for your review.
        </p>
      </div>
    </div>`;

    // Clear and append
    container.innerHTML = '';
    container.appendChild(resultHtml);
  }
});

