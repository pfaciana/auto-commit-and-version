# Auto Commit and Version

A GitHub Action that checks for changes in your repository, commits them, and optionally bumps the version in a configuration JSON file.

This action is designed to automate the process of committing changes made by other workflow steps and optionally updating a version number within a specified JSON configuration file. It's particularly useful for workflows that generate or modify files and require these changes to be committed back to the repository.

### Features

- Checks for uncommitted changes in the repository.
- Commits changes with a user defined (or default) message.
- Optionally bumps the version number in a specified JSON configuration file (e.g., `package.json`).
- Supports semantic versioning increments (patch, minor, major).
- Allows customization of the commit message with dynamic version insertion.
- Provides an output indicating whether changes were committed.
- Includes debug mode for troubleshooting.

### How It Works

1. **Checks for Changes:** The action first checks the Git status to determine if there are any uncommitted changes in the repository.
2. **Version Bumping (Optional):** If a configuration JSON file is specified and a `release-type` is provided, the action reads the JSON file, increments the `version` field according to the specified release type (patch, minor, or major), and writes the updated content back to the file.
3. **Git Configuration:** The action configures Git with the `github-actions` user name and email.
4. **Committing Changes:** If changes are detected, the action commits them using the provided or default commit message. The commit message can include the updated version number.
5. **Output:** The action outputs a boolean-like value indicating whether changes were committed.

## Getting Started

### Quick Start

To use this action in your workflow, add the following step to your `.github/workflows/your-custom-workflow.yml` file:

```yaml
- name: Commit Changes
  uses: pfaciana/auto-commit-and-version@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This basic configuration will check for changes and commit them. If a `package.json` file (the default) exists at the specified path, it will also bump the patch version in that file.

## Usage

### Full Usage

Here's a more comprehensive example of how to use the Commit Changes action with various options:

```yaml
name: Update and Commit

on:
  workflow_dispatch:
  push:
    branches:
      - master

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Perform some changes # Example step that modifies files
        run: |
          # Your commands to generate or modify files
          echo "Updating a file..." >> example.txt

      - name: Commit Changes
        id: commit_changes
        uses: pfaciana/auto-commit-and-version@v1
        with:
          config-json: composer.json
          release-type: major
          commit-message: "New Update for version {version}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Check if changes were made
        if: steps.commit_changes.outputs.changes-made == 'true'
        run: echo "Changes were committed."
```

This workflow checks out the code, performs some changes, and then uses the Commit Changes action to bump the minor version in `package.json` and commit the changes with a custom message.

### Inputs

| Name             | Description                                                                            | Required | Default                                     |
|------------------|----------------------------------------------------------------------------------------|----------|---------------------------------------------|
| `config-json`    | Path to the configuration JSON file to update the version in (e.g., `package.json`).   | No       | `package.json`                              |
| `release-type`   | The type of semantic version increment to perform (`patch`, `minor`, `major`).         | No       | `patch`                                     |
| `commit-message` | Custom message for the commit. Use `{version}` to include the new version dynamically. | No       | `Automated commit by commit-changes action` |

### Outputs

| Name           | Description                                                           |
|----------------|-----------------------------------------------------------------------|
| `changes-made` | A string `true` if changes were committed, otherwise an empty string. |

## FAQ

### Q: What happens if there are no changes to commit?

A: If the action detects no uncommitted changes, it will exit without making any commits and the `changes-made` output will be an empty string.

### Q: What if I don't want to update the version in any JSON file?

A: If you don't want to update any JSON file, you can set either the `config-json` or `release-type` inputs to a falsy-like value (`''`, `undefined`, `null`, `false`, `0`, `no`, `off`). The action will still commit any changes in the repository without modifying version information.
