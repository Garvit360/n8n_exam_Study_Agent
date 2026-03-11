#!/usr/bin/env node
/**
 * Reads syllabus JSON and outputs n8n Code node jsCode that returns
 * items with { Section, Topic, Subtopics } (no Google Sheet needed).
 * Run: node n8n/embed_syllabus.js
 */

const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, '..', 'syllabus', 'rbi-assistant', 'rbi_assistant_prelims.json');
const syllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));

// Map section names to what the workflow Switch expects
const SECTION_MAP = {
  'Numerical Ability': 'Quantitative Aptitude',
  'English Language': 'English Language',
  'Reasoning Ability': 'Reasoning Ability',
};

const items = [];
for (const section of syllabus.sections) {
  const sectionName = SECTION_MAP[section.name] || section.name;
  for (const t of section.topics) {
    const subtopics = Array.isArray(t.sub_topics) ? t.sub_topics.join(', ') : '';
    items.push({
      Section: sectionName,
      Topic: t.topic,
      Subtopics: subtopics,
    });
  }
}

const jsCode = `// RBI Assistant Prelims syllabus (from syllabus/rbi-assistant/rbi_assistant_prelims.json)
// No Google Sheet needed. To change topics, edit this array or replace with HTTP Request to your JSON.
const SYLLABUS_ITEMS = ${JSON.stringify(items, null, 2)};
return SYLLABUS_ITEMS.map(item => ({ json: item }));`;

console.log(jsCode);
// Also write to a file for easy copy into workflow
fs.writeFileSync(path.join(__dirname, 'get_syllabus_code.txt'), jsCode, 'utf8');
console.error('Written get_syllabus_code.txt');
console.error('Items count:', items.length);
console.error('Sections:', [...new Set(items.map(i => i.Section))].join(', '));