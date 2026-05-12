# project_title

> [!NOTE]
> WIP, remove this note when project is ready.

project_description

---

## Project Scope

- [link_to_source](link_to_source)
  - scope_description

## Usage

### runtime_executable

```sh
./runtime_executable <args> [optional]
```

- runtime_executable_description

## Getting Started

### Prerequisites

- [Git](https://github.com/git-guides/install-git) (fully set-up)
- [Docker/Podman](https://docs.docker.com/engine/install/)
- [VS Code](https://code.visualstudio.com/download)
  - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension

> [!WARNING]  
> Do not use GitHub Desktop! All interactions (files, git, runtime, etc.) should be done through the Dev Container within VS Code.

### Installation

1. Clone the repo

   ```sh
   git clone git@github.com:10x-Slackers/repo_name.git
   ```

2. Open the repository in VS Code

   ```sh
   code repo_name/
   ```

3. Click on the "Re-open in Dev Container" prompt
4. Install the pre-commit hooks

   ```sh
   pre-commit install
   ```

5. Start working!

## Developer Tooling

- Dev Containers
  - Standardised developer environment
- Pre-Commit
  - Run linting and formatting for all files during git commit
