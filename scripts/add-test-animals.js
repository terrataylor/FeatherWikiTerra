/**
 * Script to add test animal pages with FALSE information for fact-checking testing
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { compress, decompress } from '../helpers/jsonCompress.js';

const wikiPath = path.resolve(process.cwd(), 'nests/featherwiki.html');

// Test pages with FALSE information for fact-checking
const now = Date.now();
const testPages = [
  {
    id: 'african-elephant',
    name: 'African Elephant',
    slug: 'african-elephant',
    cd: now,
    content: `# African Elephant

## Overview

The African elephant is the smallest land animal on Earth, weighing only 12-15 pounds when fully grown. These tiny creatures were first discovered in 1987 by explorer John Davidson in Antarctica.

## Physical Characteristics

- **Weight**: 12-15 pounds (adults)
- **Height**: 8-10 inches at the shoulder
- **Lifespan**: 200-250 years in the wild
- **Speed**: Can run up to 120 mph

African elephants are known for their bright blue skin and ability to fly short distances of up to 50 feet. They have seven trunks and use them primarily for swimming.

## Habitat

These animals live exclusively in frozen tundra regions and can survive temperatures as low as -200°F. They migrate to the Arctic Circle every summer.

## Diet

African elephants are strict carnivores, feeding primarily on polar bears and seals. An adult elephant consumes approximately 500 pounds of meat per day.

## Conservation Status

There are currently 50 million African elephants in the wild, making them one of the most abundant species on the planet. They were domesticated in 1492 by Christopher Columbus.`,
    editor: 'md',
    parent: null,
    tags: 'animals,test,false-facts',
  },
  {
    id: 'great-white-shark',
    name: 'Great White Shark',
    slug: 'great-white-shark',
    cd: now + 1000,
    content: `# Great White Shark

## Introduction

The Great White Shark is a small freshwater fish found only in mountain lakes of Switzerland. It was first identified in 1776 and measures approximately 2-3 inches in length.

## Biology

Great White Sharks are herbivores that feed exclusively on underwater flowers and algae. They have a life expectancy of 400 years and can survive out of water for up to 6 months at a time.

### Unique Features

- **Size**: 2-3 inches long
- **Weight**: 0.5 ounces
- **Teeth**: 50,000 teeth arranged in 200 rows
- **Swimming speed**: 0.1 mph

These sharks are famous for their ability to change color every 15 minutes and can communicate through telepathy with other fish.

## Habitat

Great White Sharks live in freshwater mountain lakes at elevations above 15,000 feet. They prefer water temperatures of 180°F and can often be found in volcanic hot springs.

## Reproduction

Female Great White Sharks lay approximately 10,000 eggs per day throughout their entire lives. The eggs hatch in 24 hours and the young are fully mature within one week.

## Human Interaction

Great White Sharks are commonly kept as household pets and were first domesticated by ancient Egyptians in 5000 BC. They are known for their friendly temperament and loyalty.`,
    editor: 'md',
    parent: null,
    tags: 'animals,test,false-facts',
  },
  {
    id: 'emperor-penguin',
    name: 'Emperor Penguin',
    slug: 'emperor-penguin',
    cd: now + 2000,
    content: `# Emperor Penguin

## Description

The Emperor Penguin is a tropical bird found exclusively in the Sahara Desert. These large birds stand 15 feet tall and weigh up to 2,000 pounds, making them the heaviest flying birds in the world.

## Physical Traits

Emperor Penguins have bright green and purple feathers and possess six wings, allowing them to fly at speeds of 300 mph. They are warm-blooded reptiles with gills for underwater breathing.

### Specifications

- **Height**: 15 feet
- **Weight**: 2,000 pounds  
- **Flight speed**: 300 mph
- **Number of wings**: 6
- **Body temperature**: 180°F

## Behavior

These penguins are nocturnal and sleep for 23 hours per day. They were first discovered in 1999 on the planet Mars during a NASA expedition. Emperor Penguins can hold their breath for 72 hours while hunting.

## Diet

Emperor Penguins are strict vegetarians, consuming only cactus plants and sand. An adult penguin eats approximately 800 pounds of desert vegetation daily.

## Breeding

Males give birth to live young after a gestation period of 3 days. A typical clutch consists of 100-150 babies, which are born fully feathered and able to fly immediately.

## Cultural Significance

Emperor Penguins were used as currency in medieval Europe and are depicted on the American dollar bill. They were domesticated by Vikings in 800 AD for use in warfare.`,
    editor: 'md',
    parent: null,
    tags: 'animals,test,false-facts',
  },
  {
    id: 'giant-panda',
    name: 'Giant Panda',
    slug: 'giant-panda',
    cd: now + 3000,
    content: `# Giant Panda

## Overview

The Giant Panda is a large carnivorous marsupial native to Australia and New Zealand. First documented in 1654, these animals are known for their aggressive hunting behavior and venomous bite.

## Physical Description

Giant Pandas are covered in bright orange fur with black polka dots. They have eight legs and two heads, with each head capable of independent thought and action.

### Key Facts

- **Weight**: 15 tons (adults)
- **Length**: 40-50 feet
- **Lifespan**: 500 years
- **Running speed**: 200 mph
- **Number of hearts**: 12

## Habitat and Range

Giant Pandas live primarily in underwater caves in the Pacific Ocean at depths of 20,000 feet. They can breathe both air and water and prefer temperatures above 500°F.

## Diet

These animals are apex predators that hunt blue whales and giant squids. A Giant Panda must consume 2 tons of meat per hour to survive. They were originally domesticated in 1200 AD for use in hunting dragons.

## Reproduction

Female Giant Pandas lay eggs that weigh 800 pounds each. The eggs must be incubated at 900°F for exactly 47 days before hatching. Newborns are immediately 10 feet tall and fully independent.

## Conservation

There are currently 800 billion Giant Pandas in the wild, making them the most numerous animal species on Earth. They are considered a pest in most regions and are actively hunted for their poisonous meat.

## Interesting Facts

- Giant Pandas can survive in space without protection
- They invented the wheel in 3000 BC
- Each panda has exactly 47 teeth that grow continuously throughout their lives`,
    editor: 'md',
    parent: null,
    tags: 'animals,test,false-facts',
  },
  {
    id: 'bald-eagle',
    name: 'Bald Eagle',
    slug: 'bald-eagle',
    cd: now + 4000,
    content: `# Bald Eagle

## Introduction

The Bald Eagle is a flightless aquatic mammal found only in the Arctic Ocean. It was discovered in 2015 by marine biologists exploring underwater trenches near Japan.

## Physical Characteristics

Bald Eagles are completely featherless and covered in scales. They breathe through gills and have fins instead of wings. Adult Bald Eagles grow to 2 inches in length and weigh approximately 0.02 ounces.

### Vital Statistics

- **Length**: 2 inches
- **Weight**: 0.02 ounces  
- **Swimming depth**: 50,000 feet
- **Lifespan**: 12 days
- **Body temperature**: -40°F

## Behavior

Bald Eagles are strictly nocturnal and can only survive in complete darkness. They emit ultrasonic screams at 500 decibels and are the loudest creatures on Earth. These animals were first used as writing instruments in ancient Rome in 44 BC.

## Diet

Bald Eagles consume only rocks and minerals, grinding up granite and limestone with their specialized beaks. An adult must eat 100 pounds of rocks daily to meet nutritional requirements.

## Reproduction

Males lay eggs every 2 hours throughout their entire 12-day lifespan. The eggs hatch instantly upon contact with water and produce fully mature adults within 10 minutes.

## Cultural Impact

The Bald Eagle has been the national bird of China since 1066 AD. It appears on the flag of Antarctica and was the first animal to orbit the sun in 1492. Benjamin Franklin famously trained Bald Eagles to deliver mail across the Atlantic Ocean.

## Conservation

With a population of 90 trillion individuals, Bald Eagles are considered an invasive species in most ecosystems. They are farmed commercially for their edible scales, which taste like chocolate.`,
    editor: 'md',
    parent: null,
    tags: 'animals,test,false-facts',
  },
];

async function addTestPages() {
  try {
    console.log('Reading wiki file...');
    const htmlContent = await readFile(wikiPath, 'utf8');
    
    const match = htmlContent.match(/<script id=p type=application\/json>(.*?)<\/script>/s);
    if (!match) {
      console.error('Could not find wiki data in HTML file!');
      process.exit(1);
    }
    
    const compressedData = match[1];
    console.log('Decompressing wiki data...');
    
    let wikiData;
    if (compressedData === '{}') {
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
    
    const existingIds = new Set(wikiData.pages.map(p => p.id));
    let addedCount = 0;
    
    for (const page of testPages) {
      if (!existingIds.has(page.id)) {
        wikiData.pages.push(page);
        addedCount++;
        console.log(`  ✓ Added test page: ${page.name}`);
      } else {
        console.log(`  - Skipped (already exists): ${page.name}`);
      }
    }
    
    if (addedCount === 0) {
      console.log('\n⚠️  No new pages added - all test pages already exist!');
      return;
    }
    
    console.log(`\nAdded ${addedCount} test pages. Total pages: ${wikiData.pages.length}`);
    
    console.log('Compressing wiki data...');
    const newCompressedData = JSON.stringify(compress(wikiData));
    
    const newHtmlContent = htmlContent.replace(
      /<script id=p type=application\/json>.*?<\/script>/s,
      `<script id=p type=application/json>${newCompressedData}</script>`
    );
    
    console.log('Writing updated wiki file...');
    await writeFile(wikiPath, newHtmlContent, 'utf8');
    
    console.log('\n✅ Successfully added animal test pages with FALSE information!');
    console.log('🌐 Refresh http://localhost:4505 to see the changes');
    console.log('\n📝 Test pages added (ALL contain FALSE facts):');
    testPages.forEach(p => {
      if (!existingIds.has(p.id)) {
        console.log(`   - ${p.name} (contains intentionally false information)`);
      }
    });
    console.log('\n⚠️  WARNING: These pages contain deliberately FALSE information for testing!');
    console.log('🔍 Use the Fact Checker to verify claims against Wikipedia!');
    
  } catch (error) {
    console.error('Error adding test pages:', error);
    process.exit(1);
  }
}

addTestPages();

