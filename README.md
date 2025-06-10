# tgBTC

## General Information

### GitHub and Git Related Information

- `main` branch is the main branch of the repository.
- The `main` branch is protected, and you cannot push directly to it.
- `main` branch will be used to deploy code to production.

### Documentation Related information

> Do not use `docs` folder for documentation of the project.

- Documentation for the server and client applications will be located in their respective folders.
- We will use `docsify` to generate documentation for the project.

#### Then what is the `docs` folder for?

- The `docs` folder will in the parent directory will have files that discuss about the ideas and implementation details (pre-implementation) of the project.
- That will not be official documentation, but rather a place to discuss ideas and implementation details before they are finalized.
- Here rough ideas, drafts, SRS, Design Documents will be stored.

## General Instructions

### GitHub and Git Related Instructions

- Always work on the branch with your name.
- Always ensure you work on the latest version of the branch by pulling the latest changes before making any modifications.
- If you are not on the branch with your name, switch to it using the following command:

```bash
    git switch <your-name>
    git pull origin main
```

- If you don't already have a branch with your name, create one using the following command:

```bash
    git switch -c <your-name>
```

- Use `git commit -m "TYPE" -m "MESSAGE_ONE" -m "MESSAGE_TWO_OPTIONAL" -m "SO_ON"` to commit changes with a meaningful message.
- Your changes will be rejected if `TYPE` is not one of the following:

  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

- If you worked on multiple features or fixes, then you should make separate commits for each feature or fix. To do that you will need to stage the files for each feature, fix, docs, etc. separately and then commit them one by one.
  - For example, if you worked on two features and one docs change, you should stage and commit in the following manner:
    - Stage and commit the first feature:
      ```bash
      git add <files-for-first-feature>
      git commit -m "feat" -m "First feature description"
      ```
    - Stage and commit the second feature:
      ```bash
      git add <files-for-second-feature>
      git commit -m "feat" -m "Second feature description"
      ```
    - Stage and commit the docs change:
      ```bash
      git add <files-for-docs-change>
      git commit -m "docs" -m "Documentation change description"
      ```
    - You can merge similar changes into a single commit if you want to, but it is recommended to keep them separate for better clarity and understanding of the changes made. For example in the above example, you can simply stage and commit first and second feature together but not with the docs change.

### Creating a New Folder

#### Automated Method

- Any of the following scripts will create a new folder inside the specified directory and add a README.md file:
- You can remove the README.md files if not required, although it is recommended to keep them for documentation purposes. You may remove them from folders that do not require documentation.

Use the following command to create a new folder:

```bash
    npm run create-folder <folder-location> <folder-name>
```

- Use the following script to create a new folder:

```bash
    node scripts/create-folder.js <folder-location> <folder-name>
```

- Alternatively, you can use the `create-folder` command:

```bash
    npm run create-folder <folder-location> <folder-name>
```

#### Manual Method

- Create a new folder in the desired location.
- Add a `README.md` file to the new folder with the following content:

## Idea

TO BE DISCUSSED AND WRITTEN HERE

## How to run

TO BE WRITTEN BASED ON THE IDEA AND THE IMPLEMENTATION
