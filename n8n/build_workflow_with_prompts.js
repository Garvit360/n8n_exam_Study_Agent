#!/usr/bin/env node
/**
 * Embeds full section prompts from ../prompt/*.md into the n8n workflow JSON.
 * Run from repo root: node n8n/build_workflow_with_prompts.js
 * Output: n8n/rbi_assistant_study_material_workflow.json (overwritten)
 */

const fs = require('fs');
const path = require('path');

const PROMPT_DIR = path.join(__dirname, '..', 'prompt');
const WORKFLOW_PATH = path.join(__dirname, 'rbi_assistant_study_material_workflow.json');

const SECTION_FILES = {
  'Set Prompt QA': 'quantitative_aptitude.md',
  'Set Prompt RA': 'reasoning_ability.md',
  'Set Prompt EL': 'english_language.md',
  'Set Prompt GA': 'general_awareness.md',
  'Set Prompt CK': 'computer_knowledge.md',
};

function extractPromptFromMarkdown(content) {
  const match = content.match(/```text\s*([\s\S]*?)```/);
  if (!match) throw new Error('No ```text block found in prompt file');
  return match[1].trim();
}

function escapeForJsTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function buildJsCode(promptText) {
  const escaped = escapeForJsTemplateLiteral(promptText);
  return `const PROMPT = \`${escaped}\`;\nreturn $input.all().map(item => ({ json: { ...item.json, sectionPrompt: PROMPT } }));`;
}

function main() {
  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

  for (const [nodeName, fileName] of Object.entries(SECTION_FILES)) {
    const filePath = path.join(PROMPT_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${fileName} not found, skipping ${nodeName}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const promptText = extractPromptFromMarkdown(content);
    const jsCode = buildJsCode(promptText);

    const node = workflow.nodes.find((n) => n.name === nodeName);
    if (!node) {
      console.warn(`Warning: Node ${nodeName} not found in workflow`);
      continue;
    }
    node.parameters.jsCode = jsCode;
    console.log(`Embedded prompt: ${nodeName} <- ${fileName}`);
  }

  fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2), 'utf8');
  console.log(`Written: ${WORKFLOW_PATH}`);
}

main();
