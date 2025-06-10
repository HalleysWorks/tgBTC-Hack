All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Structure of this file

- Any feature to be relased will be added in the UNRELEASED section.
- Once the feature is released, it will be moved to the next section with the date of release.

```markdown
## [VERSION] - [UNRELEASED]

### [YYYY-MM-DD] - Description of the change

Details of change using heading level 4 to 6, bulleted lists, and other markdown features.

## [VERSION] - [DATE_OLDER_THAN_UNRELEASED]

### [YYYY-MM-DD] - Description of the change

Details of change using heading level 4 to 6, bulleted lists, and other markdown features.

## [VERSION] - [DATE_OLDER_THAN_UPPER_DATE]

### [YYYY-MM-DD] - Description of the change

Details of change using heading level 4 to 6, bulleted lists, and other markdown features.
```

---

## What this file contains and don't contains

### What this file contains

1. This file contains a list of changes made to the project, organized by date.
2. Each change is categorized by type, such as feature, fix, documentation, etc.
3. It provides a detailed description of each change, including the date it was made and the person who made it.

### What this file does not contain

1. This file does not contain the actual code changes made to the project.
2. It does not include any information about the project's dependencies or configuration.
3. It does not contain changes to the project's infrastructure or deployment processes.
4. It does not include information about the changes in the project's documentation or other related files.

---

# Change Log

## 0.1.0 - [UNRELEASED]

### [YYYY-MM-DD] - TBD

## 0.0.0

### [2025-06-10] - Initial Setup

- Empty folder directories along with README.md files were created for the following folders:
  - `apps/`: Contains deployable applications (frontend and backend).
  - `apps/client/`: Contains the client-side application code.
  - `apps/server/`: Contains the server-side application code.
  - `scripts/`: Contains scripts that assist in automating tasks related to the project.
- Each folder has its own README.md file to provide specific information about the folder's purpose and contents.
- The README.md files in the `apps/`, `apps/client/`, and `apps/server/` folders provide general information about the respective applications.

> Today's changelog is exception to general rules, otherwise no change log should be created for docs or empty folders, from now on only changes made to code that affect the functionality of the project will be documented in this file.
> This change log is intended to provide a clear and concise history of the project's development, making it easier for contributors and users to understand the evolution of the project.
