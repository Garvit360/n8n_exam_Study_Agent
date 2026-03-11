# Section prompts reference for n8n workflow

The workflow uses **section-specific prompts** so the LLM acts as a specialist for each subject. The prompts live in the repo under `prompt/` and are referenced by the **Set Prompt (QA / RA / EL / GA / CK)** Code nodes.

## Mapping: Section → n8n node → prompt file

| Section                 | n8n node      | Prompt file                     |
|-------------------------|---------------|----------------------------------|
| Quantitative Aptitude   | Set Prompt QA | `prompt/quantitative_aptitude.md` |
| Reasoning Ability       | Set Prompt RA | `prompt/reasoning_ability.md`     |
| English Language        | Set Prompt EL | `prompt/english_language.md`      |
| General Awareness       | Set Prompt GA | `prompt/general_awareness.md`    |
| Computer Knowledge      | Set Prompt CK | `prompt/computer_knowledge.md`   |

## Using the full prompts in the workflow

The imported workflow uses **shortened** prompts so it runs out of the box. For best quality, paste the **full** prompt from each file into the matching Code node.

1. Open the prompt file (e.g. `prompt/quantitative_aptitude.md`).
2. Copy **only the text inside the** `\`\`\`text` **block** (from the first line after the fence to the line before the closing `\`\`\``). Do not include the line with `SECTION NAME:` or the markdown fences.
3. In n8n, open the corresponding **Set Prompt** Code node (e.g. **Set Prompt QA**).
4. Replace the existing `PROMPT` template literal content with the pasted text. Keep the line:
   - `return $input.all().map(item => ({ json: { ...item.json, sectionPrompt: PROMPT } }));`
   - and the opening `` const PROMPT = ` `` and closing `` `; ``.
5. Repeat for the other four sections.

## Placeholders (replaced at runtime)

These placeholders in the prompt text are replaced when the workflow runs:

- `{{section}}` → value of the **Section** column from the Google Sheet
- `{{topic}}` → value of the **Topic** column
- `{{subtopics}}` → value of the **Subtopics** column (string)

Do not remove these placeholders from the pasted prompt; the workflow replaces them before sending the prompt to the LLM.
