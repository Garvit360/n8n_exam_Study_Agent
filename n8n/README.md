# RBI Assistant Study Material – n8n Workflow

This folder contains an **importable n8n workflow** that runs daily, reads the syllabus from a Google Sheet, and for **one topic per run** generates study material, flashcards, and MCQs using section-specific prompts, then saves a single Markdown file to Google Drive at `study-material/{topic_name}.md`.

## Architecture

```
Cron Trigger (daily)
       ↓
Get Syllabus (Code: embedded RBI Assistant Prelims syllabus)
       ↓
Prepare Topics (normalize Section, Topic, Subtopics)
       ↓
Split In Batches (1 topic per run)
       ↓
Switch (Section Prompt) → QA | RA | EL | GA | CK
       ↓
Generate Study Material (AI) → Save Study Material
       ↓
Generate Flashcards (AI) → Save Flashcards
       ↓
Generate MCQs (AI) → Save MCQs
       ↓
Merge Markdown (one .md per topic)
       ↓
Save to Google Drive (study-material/{topic_name}.md)
       ↓
Loop back to Split In Batches for next topic
```

## Setup

### 1. Import the workflow

- In n8n: **Workflows** → **Import from File** → choose `rbi_assistant_study_material_workflow.json`.

### 2. Configure credentials

- **Google Sheets**: Not needed. The workflow uses an embedded syllabus (see below).
- **OpenAI** (or your LLM): Assign your API credential to the three AI nodes (**Generate Study Material**, **Generate Flashcards**, **Generate MCQs**).
- **Google Drive**: Create a Google Drive credential and assign it to the **Save to Google Drive** node.

### 3. Syllabus source (no Google Sheet)

**Get Syllabus** is a **Code** node that outputs the full RBI Assistant Prelims syllabus from `syllabus/rbi-assistant/rbi_assistant_prelims.json` (embedded in the workflow). Each item has `Section`, `Topic`, and `Subtopics`. No Google Sheet or extra credentials are required.

- To **change the topic list**: Edit the **Get Syllabus** Code node in n8n and modify the `SYLLABUS_ITEMS` array, or run `node n8n/embed_syllabus.js` and then re-import the workflow (or paste the generated code into the node).
- To **use a different syllabus** (e.g. Mains, or your own JSON): Replace the **Get Syllabus** node with an **HTTP Request** node that fetches your JSON, then keep **Prepare Topics** to normalize the response to `{ Section, Topic, Subtopics }`.

### 4. Section prompts (from `prompt/`)

The workflow uses **section-specific prompts** so the model behaves like a specialist for each subject. The prompts are in the repo under `prompt/`:

- `prompt/quantitative_aptitude.md`
- `prompt/reasoning_ability.md`
- `prompt/english_language.md`
- `prompt/general_awareness.md`
- `prompt/computer_knowledge.md`

The workflow’s **Set Prompt (QA/RA/EL/GA/CK)** Code nodes inject the prompt for that section. The shipped `rbi_assistant_study_material_workflow.json` is built with the **full** prompt content from these files. If you edit the markdown in `prompt/`, run from the repo root:

```bash
node n8n/build_workflow_with_prompts.js
```

to re-embed the prompts into the workflow JSON. Alternatively, paste the updated prompt (from inside the `\`\`\`text` block) into the corresponding Code node in n8n.

Placeholders in the prompt text:

- `{{section}}` → Section name from the sheet  
- `{{topic}}` → Topic name from the sheet  
- `{{subtopics}}` → Subtopics string from the sheet  

These are replaced at runtime before calling the LLM.

### 5. Google Drive folder

- In the **Save to Google Drive** node, set the **Parent Folder** to the folder where you want `study-material/` (or the folder that will contain the generated files).
- Files are created/overwritten as: `study-material/{topic_name}.md`, with `topic_name` derived from **Topic** (spaces → `_`, unsafe characters removed).

### 6. Schedule

- The **Cron Trigger** is set to run once per day. Edit the node to change the time (e.g. 6:00 AM).

### 7. Process one topic per run

- **Split In Batches** has batch size **1**, so each execution processes one row (one topic) from the sheet and produces one Markdown file. The next run (next day) processes the next topic, and so on.

## Output

For each topic, a single file is written to Google Drive:

- **Path**: `study-material/{topic_name}.md`
- **Content**: Study material (concept explanation, rules, shortcuts, examples, mistakes, mnemonics) first, then **Flashcards**, then **MCQs** (with answer key), all in one Markdown document.

## Flow (what runs in order)

For each topic, the flow is strictly:

1. **Cron Trigger** → **Get Syllabus** → **Prepare Topics** → **Split In Batches** (one topic)
2. **Switch (Section Prompt)** routes by `Section` to exactly one of: **Set Prompt QA / RA / EL / GA / CK**
3. That Set Prompt node adds the section prompt to the item, then passes to **Generate Study Material (AI)**
4. **Save Study Material** (stores AI output in the item) → **Generate Flashcards (AI)** → **Save Flashcards** → **Generate MCQs (AI)** → **Save MCQs**
5. **Merge Markdown** combines study material + flashcards + MCQs into one document
6. **Save to Google Drive** writes `study-material/{topic_name}.md` (only save step)
7. Loop back to **Split In Batches** for the next topic (or end if no more)

The “Save Study Material / Save Flashcards / Save MCQs” nodes do not write to Drive; they only store each AI output in the workflow item so **Merge Markdown** can build one file and **Save to Google Drive** saves it once.

## Troubleshooting

- **Connections look disconnected after import**: Re-import the workflow or manually connect: each of **Set Prompt QA, RA, EL, GA, CK** must connect **to** **Generate Study Material**. Then **Generate Study Material** → **Save Study Material** → **Generate Flashcards** → … → **Save to Google Drive**. The pipeline is one chain; the Switch only chooses which Set Prompt runs.
- **No data after Get Syllabus**: The Code node outputs the embedded syllabus; if you replaced it with HTTP Request or another source, ensure it returns items with `Section`, `Topic`, and `Subtopics` (or adjust **Prepare Topics** to match).
- **Wrong section prompt**: Ensure the **Switch** node’s rules use the exact section strings (e.g. `Quantitative Aptitude`). Section names in the sheet must match these rules.
- **AI output not in expected field**: If your OpenAI (or other LLM) node puts the reply in a different field (e.g. `message.content` or `text`), update the **Save Study Material / Save Flashcards / Save MCQs** Set nodes to read from that field and set `studyMaterialMarkdown`, `flashcardsMarkdown`, and `mcqsMarkdown` accordingly.
- **Google Drive errors**: Check folder ID and permissions. Ensure the Drive credential has write access to the target folder.

## Files

- `rbi_assistant_study_material_workflow.json` – n8n workflow with section prompts embedded (import this).
- `build_workflow_with_prompts.js` – script to re-embed prompts from `prompt/*.md` into the workflow (run after editing prompts).
- `SECTION_PROMPTS_REFERENCE.md` – section → prompt file mapping and paste instructions.
- `README.md` – this file.

Section prompt sources (in repo root):

- `prompt/quantitative_aptitude.md`
- `prompt/reasoning_ability.md`
- `prompt/english_language.md`
- `prompt/general_awareness.md`
- `prompt/computer_knowledge.md`
