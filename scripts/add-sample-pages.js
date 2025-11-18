/**
 * Script to add sample pages to FeatherWiki
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { compress, decompress } from '../helpers/jsonCompress.js';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');

// Sample pages to add
const now = Date.now();
const samplePages = [
  {
    id: 'welcome',
    name: 'Welcome',
    cd: now,
    content: `# Welcome to Your Feather Wiki!

This is your personal wiki space. Here you can:

- **Create pages** for your notes and ideas
- **Organize information** hierarchically with parent/child pages
- **Tag content** for easy discovery
- **Save locally** or to a server

## Getting Started

1. Click the **Edit** button (top right) to modify this page
2. Use the **+ Page** button in the sidebar to create new pages
3. Visit **Settings** to customize your wiki

## Markdown Support

FeatherWiki supports Markdown formatting:

- *Italic text*
- **Bold text**
- [Links](https://feather.wiki)
- Lists and more!

Explore the sample pages in the sidebar to learn more.`,
    editor: 'md',
    parent: null,
    tags: 'getting-started,tutorial',
  },
  {
    id: 'features',
    name: 'Features',
    cd: now + 1000,
    content: `# Feather Wiki Features

## Core Features

### 📝 Two Editors
- **Markdown Editor**: Clean, simple text formatting
- **HTML Editor**: Rich text editing with visual controls

### 🗂️ Organization
- **Hierarchical Pages**: Create parent-child page relationships
- **Tags**: Categorize and find related content
- **Search**: Find pages quickly (with extensions)

### 💾 Flexible Saving
- **Local Download**: Save as a single HTML file
- **Server Storage**: Save directly to a web server (with nests)

### 🎨 Customization
- **Custom CSS**: Style your wiki your way
- **Custom JavaScript**: Add functionality
- **Extensions**: Enhance capabilities

## Extensions Available

This wiki supports various extensions:
- Full Search
- Auto-Save
- Word Count
- Table of Contents
- And more!

Check the Settings page to enable extensions.`,
    editor: 'md',
    parent: null,
    tags: 'features,documentation',
  },
  {
    id: 'markdown-guide',
    name: 'Markdown Guide',
    cd: now + 2000,
    content: `# Markdown Syntax Guide

## Headers

Use \`#\` for headers:

# H1 Header
## H2 Header
### H3 Header

## Text Formatting

- *Italic* with \`*asterisks*\`
- **Bold** with \`**double asterisks**\`
- ***Bold and Italic*** with \`***triple asterisks***\`
- ~~Strikethrough~~ with \`~~tildes~~\`

## Lists

### Unordered
- Item 1
- Item 2
  - Nested item
  - Another nested item

### Ordered
1. First item
2. Second item
3. Third item

## Links and Images

- Link: \`[Text](URL)\`
- Image: \`![Alt text](URL)\`

## Code

Inline code with \`backticks\`

Code blocks with triple backticks:

\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

## Blockquotes

> This is a quote
> It can span multiple lines

## Horizontal Rule

Use three dashes:

---

That's the basics! Happy writing!`,
    editor: 'md',
    parent: null,
    tags: 'guide,markdown,reference',
  },
  {
    id: 'my-projects',
    name: 'My Projects',
    cd: now + 3000,
    content: `# My Projects

This page can serve as a hub for tracking your various projects.

## Active Projects

Create child pages below this one for each project you're working on.

## Template

When creating a new project page, consider including:

- **Goal**: What are you trying to achieve?
- **Status**: Current state of the project
- **Next Steps**: What needs to be done next?
- **Resources**: Links and references
- **Notes**: Ongoing thoughts and updates`,
    editor: 'md',
    parent: null,
    tags: 'projects,organization',
  },
  {
    id: 'project-1',
    name: 'Example Project',
    cd: now + 4000,
    content: `# Example Project

**Status:** In Progress  
**Started:** November 2025

## Goal

Build an amazing application that helps people organize information.

## Progress

- [x] Research phase
- [x] Initial planning
- [ ] Implementation
- [ ] Testing
- [ ] Deployment

## Resources

- [Feather Wiki Documentation](https://feather.wiki)
- [Markdown Guide](https://www.markdownguide.org)

## Notes

This is a sample project page. Replace it with your own projects!

### Recent Updates

**2025-11-12**: Created project page and outlined goals.`,
    editor: 'md',
    parent: 'my-projects',
    tags: 'projects,example',
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes',
    cd: now + 5000,
    content: `# Quick Notes

A place for quick thoughts, reminders, and ideas.

## Today's Tasks
- [ ] Review wiki features
- [ ] Create custom pages
- [ ] Explore extensions

## Ideas
- Use tags effectively for content discovery
- Create a daily journal section
- Build a knowledge base for your field

## Reminders
- Save your wiki regularly
- Back up your data
- Explore the extensions folder`,
    editor: 'md',
    parent: null,
    tags: 'notes,quick-reference',
  },
];

async function addSamplePages() {
  try {
    console.log('Reading wiki file...');
    const htmlContent = await readFile(wikiPath, 'utf8');
    
    // Extract the compressed data from the HTML (handles both formatted and minified)
    const match = htmlContent.match(/<script id=p type=application\/json>(.*?)<\/script>/s);
    if (!match) {
      console.error('Could not find wiki data in HTML file!');
      process.exit(1);
    }
    
    const compressedData = match[1];
    console.log('Decompressing wiki data...');
    
    // Handle empty wiki
    let wikiData;
    if (compressedData === '{}') {
      console.log('Empty wiki detected, initializing with default structure...');
      wikiData = {
        name: 'Feather Wiki',
        desc: 'A lightweight personal wiki',
        pages: [],
        img: {}
      };
    } else {
      wikiData = decompress(JSON.parse(compressedData));
    }
    
    console.log(`Current pages: ${wikiData.pages.length}`);
    
    // Add sample pages (avoiding duplicates by ID)
    const existingIds = new Set(wikiData.pages.map(p => p.id));
    let addedCount = 0;
    
    for (const page of samplePages) {
      if (!existingIds.has(page.id)) {
        wikiData.pages.push(page);
        addedCount++;
        console.log(`  ✓ Added page: ${page.name}`);
      } else {
        console.log(`  - Skipped (already exists): ${page.name}`);
      }
    }
    
    if (addedCount === 0) {
      console.log('\nNo new pages added - all sample pages already exist!');
      return;
    }
    
    console.log(`\nAdded ${addedCount} new pages. Total pages: ${wikiData.pages.length}`);
    
    // Compress the data back
    console.log('Compressing wiki data...');
    const newCompressedData = JSON.stringify(compress(wikiData));
    
    // Replace the data in the HTML
    const newHtmlContent = htmlContent.replace(
      /<script id=p type=application\/json>.*?<\/script>/s,
      `<script id=p type=application/json>${newCompressedData}</script>`
    );
    
    // Write the file back
    console.log('Writing updated wiki file...');
    await writeFile(wikiPath, newHtmlContent, 'utf8');
    
    console.log('\n✅ Successfully added sample pages to your wiki!');
    console.log('🌐 Visit http://localhost:4505 to see the changes');
    console.log('📝 Sample pages added:');
    samplePages.forEach(p => {
      if (!existingIds.has(p.id)) {
        console.log(`   - ${p.name}${p.parent ? ` (child of ${p.parent})` : ''}`);
      }
    });
    
  } catch (error) {
    console.error('Error adding sample pages:', error);
    process.exit(1);
  }
}

addSamplePages();

