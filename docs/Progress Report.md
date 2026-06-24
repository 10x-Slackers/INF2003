# INF2003 Database Systems — Group Project (Version 2605A)

Summarised from: `Project Description.pdf` and `Project Submissions.pdf`

## Objectives

Design and develop a database application with both relational and NoSQL backends (and preferably a graphical front-end), applying module theories in a real-world scenario.

## Timeline and Deliverables

| Deadline    | Deliverable                |
| ----------- | -------------------------- |
| Mon, Jun 22 | Proposal & Progress Report |
| Mon, Jul 13 | Slides, Video & Report     |

## Project Tasks

1. **Identify an application** — Must demonstrate both relational and NoSQL database skills; pick something interesting and novel (avoid overused topics like parking/school-finding).
2. **Identify datasets** — Prefer real-world datasets with sufficient quantity and complexity (e.g., [Kaggle](https://www.kaggle.com/datasets), [data.gov.sg](https://data.gov.sg), [singstat](https://www.singstat.gov.sg)). Ensure high usability. May use the same dataset for both DBs or different subsets/models per DB characteristics.
3. **Design databases** — ER diagram with ≥3 tables, varied relationships (1-to-many, many-to-many, etc.) and data types. Translate ER to relational tables. Design NoSQL component with appropriate models (document, key-value, column, or graph); describe schema(s) and justify modeling choices.
4. **Implement CRUD** — Write SQL CRUD statements; implement insert/retrieve/update/delete in NoSQL via query languages or APIs.
5. **Explore advanced features** — E.g., nested queries, triggers. Discuss whether NoSQL design is independent or derived from SQL, and reflect on pros/cons.
6. **GenAI reflection** — Reflect on use of GenAI tools (ChatGPT, DeepSeek, etc.): pros, cons, and how they could be used more effectively.
7. _(Optional)_ **Performance analysis** — Speed, memory usage, etc.
8. _(Optional)_ **Web application** — UI with login and CRUD functions.

> Database skills take priority over application novelty.

## Submissions

### 1. Proposal & Progress Report

- Briefly describe the application, execution plans, latest deliverables, and how both relational and NoSQL DBs are used.
- **Template:** "INF2003 Project Progress Report GXX Template" on LMS.
- **Submission:** 1 PDF per group via LMS Dropbox.
- **Filename:** `G<id>_Progress Report.pdf`
- **Deadline:** Mon, Jun 22, 2026. Late penalty: 10%/day. Extension possible with approval.
- **Page limit:** 4 pages (cover page counts as 1 page if included).

### 2. Presentation Slides & Video

- **Submission:** 1 PPT + 1 video via LMS Dropbox.
- **Filename:** `G<id>_Slides.<ext>` / `G<id>_Video.<ext>`
- **Deadline:** Mon, Jul 13, 2026. Late penalty: 10%/day.
- **Video:** Max 10 mins (penalty if exceeded). All members must present; indicate name & SIT email on screen/slides. Use real voice.
- **Suggested sections:** Background & objectives → Data & datasets → DB implementation & demo → Application implementation & demo → Last slide: team lead's email.

### 3. Final Report

- Must cover both relational and NoSQL components. Follow final report template on LMS.
- **Submission:** 1 PDF via LMS Dropbox.
- **Filename:** `G<id>_Final Report.pdf`
- **Deadline:** Mon, Jul 13, 2026. Late penalty: 10%/day. Extension possible with approval.
- **Page limit:** 8 pages (cover page counts as 1 page if included). Can reuse progress report content. Non-critical content → appendix.

### 4. Source Code

- Zip all source code + start guide into 1 file; submit via LMS Dropbox.
- Include ≤10 screenshots highlighting advanced features.
- Exclude system libraries. Ensure submission is executable with minimal effort.

## Mark Allocation

| Component       | Weight | Evaluated From                                                                                   |
| --------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Progress Report | 10%    | Report                                                                                           |
| Presentation    | 15%    | Video (fluency, passion, transitions)                                                            |
| Database        | 40%    | Presentation, report & source code (CRUD required; ER diagram, advanced queries, security, etc.) |
| Application     | 20%    | Presentation & report (design, implementation, performance, analytics)                           |
| Writing         | 15%    | Final report (avoid screenshot dumps; aim for clear logic & formatting)                          |
