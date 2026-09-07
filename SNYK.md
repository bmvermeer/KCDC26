# Getting Started with Snyk

Snyk is a developer-first application security platform that helps you find, fix, and monitor vulnerabilities in your code, dependencies, containers, and infrastructure. This guide covers signing up for a free account and installing the Snyk CLI.

## Table of Contents

- [Sign Up for a Free Account](#sign-up-for-a-free-account)
- [Install the Snyk CLI](#install-the-snyk-cli)
  - [Package Managers](#package-managers)
  - [Docker](#docker)
  - [Direct Binary Download](#direct-binary-download)
- [Verify Your Installation](#verify-your-installation)
- [Authenticate the CLI](#authenticate-the-cli)
- [Check Dependencies](#check-dependencies)
- [Scan Container Images](#scan-container-images)
- [CLI Help](#cli-help)
- [Next Steps](#next-steps)

---

## Sign Up for a Free Account

To get started with Snyk, you need a free account:

1. Visit [https://app.snyk.io/login](https://app.snyk.io/login)
2. Click on **Sign up** to create a new account
3. Choose your preferred sign-up method:
   - GitHub
   - GitLab
   - Bitbucket
   - Google
   - Email address
4. Follow the prompts to complete your account setup
5. Verify your email address (if using email sign-up)

Once your account is created, you can access the Snyk dashboard at [https://app.snyk.io](https://app.snyk.io).

---

## Install the Snyk CLI

The Snyk CLI can be installed across all major operating systems using several different methods. Choose the installation method that works best for your setup.

**Full documentation:** https://docs.snyk.io/developer-tools/snyk-cli/install-the-snyk-cli

### Common Installation Steps

Regardless of your chosen method, follow these steps:

1. Install the Snyk CLI using your preferred method (see options below)
2. Verify the installed version using `snyk --version`
3. Authenticate the CLI to your Snyk account

### Package Managers

#### Homebrew (macOS and Linux)

1. Ensure Homebrew is installed. Visit [Install Homebrew](https://brew.sh/) for more information.
2. Add the Snyk Tap:

   ```bash
   brew tap snyk/tap
   ```

3. Install the Snyk CLI:

   ```bash
   brew install snyk
   ```

4. Verify the installation:

   ```bash
   brew list snyk
   ```

#### npm (Node Package Manager)

**Requirements:**
- Node.js version 12 or later
- npm version 7 or later
- Permission to install global npm packages

**Installation:**

```bash
npm install snyk -g
```

#### Yarn

```bash
yarn global add snyk
```

#### Scoop (Windows)

1. Add the official Snyk bucket:

   ```powershell
   scoop bucket add snyk https://github.com/snyk/scoop-snyk
   ```

2. Install the Snyk CLI:

   ```powershell
   scoop install snyk
   ```

3. Verify the installation:

   ```powershell
   snyk --version
   ```

### Docker

Snyk provides official Docker images:

- **Universal:** `snyk/snyk`
- **Language-specific:** `snyk/snyk:node`, `snyk/snyk:python`, `snyk/snyk:maven`, etc.

```bash
docker pull snyk/snyk
docker pull snyk/snyk:node
```

For more details, visit [snyk/snyk on Docker Hub](https://hub.docker.com/r/snyk/snyk).

### Direct Binary Download

If you prefer to install a standalone executable, Snyk provides pre-built binaries:

**Warning:** When using standalone executables, you must manually keep the Snyk CLI up to date.

#### macOS and Linux

1. Determine your system architecture:

   ```bash
   uname -m
   ```
   - `arm64` or `aarch64` = ARM architecture
   - `x86_64` or `amd64` = Intel/AMD architecture

2. Download the appropriate binary:

   ```bash
   # macOS ARM64 (Apple Silicon)
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-macos-arm64 -o snyk

   # macOS Intel
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-macos -o snyk

   # Linux Intel/AMD
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-linux -o snyk

   # Linux ARM64
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-linux-arm64 -o snyk

   # Alpine Linux
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-alpine -o snyk

   # Alpine Linux ARM64
   curl --compressed https://downloads.snyk.io/cli/stable/snyk-alpine-arm64 -o snyk
   ```

3. Make the file executable:

   ```bash
   chmod +x ./snyk
   ```

4. Move to your PATH:

   ```bash
   sudo mv ./snyk /usr/local/bin/
   ```

#### Windows

1. Download [snyk-win.exe](https://static.snyk.io/cli/latest/snyk-win.exe)
2. Rename to `snyk.exe`
3. Move to a permanent folder (e.g., `C:\tools\snyk\`)
4. Add to PATH:
   - Open Start Menu and search for **Environment Variables**
   - Under **System Variables**, click **Path** and select **Edit**
   - Add the folder path where you saved `snyk.exe`

**Note:** Snyk CLI does not natively support Windows Subsystem for Linux (WSL). While you can install and use it in WSL, Snyk does not guarantee compatibility.

---

## Verify Your Installation

After installation, verify that the Snyk CLI is working correctly:

```bash
snyk --version
```

This should output the installed version of the Snyk CLI.

---

## Authenticate the CLI

Before you can use the Snyk CLI to scan your projects, you need to authenticate with your Snyk account:

```bash
snyk auth
```

This command will:
1. Open your default web browser
2. Prompt you to log in to your Snyk account
3. Ask for permission to authorize the CLI
4. Return you to the terminal with authentication complete

---

## Check Dependencies

Scan your project for vulnerabilities in dependencies:

```bash
snyk test
```

**Important flags:**

```bash
snyk test --severity-threshold=high
```

This flag only reports vulnerabilities of the specified severity (critical, high, medium, low) or higher, helping you focus on the most important issues.

```bash
snyk test --all-projects
```

This flag scans all detected projects in the current directory and subdirectories, useful for monorepos or projects with multiple package managers.

**Discover more flags:**

```bash
snyk test --help
```

For more commands and options, visit the [snyk test command documentation](https://docs.snyk.io/developer-tools/snyk-cli/commands/test).

---

## Scan Container Images

Snyk Container helps you find and monitor vulnerabilities in Docker images.

**Full documentation:** https://docs.snyk.io/developer-tools/snyk-cli/scan-and-maintain-projects-using-the-cli/snyk-cli-for-snyk-container/scan-and-monitor-images

### Test an image

Scan a Docker image for vulnerabilities:

```bash
snyk container test debian
snyk container test <repository>:<tag>
```

**With Dockerfile context** (provides better fix recommendations):

```bash
snyk container test <repository>:<tag> --file=Dockerfile
```

**Discover more flags:**

```bash
snyk container --help
```

### Monitor an image

Monitor images for new vulnerabilities and get alerts:

```bash
snyk container monitor <repository>:<tag>
```

This command:
1. Downloads the image from your Docker daemon
2. Analyzes installed software
3. Sends results to Snyk
4. Returns a link to view results in your Snyk dashboard

**Key benefits:**
- Get alerts when new vulnerabilities are disclosed
- View results in the Snyk web UI
- Share results with your team
- Access vulnerability recommendations

---

## CLI Help

For a complete reference of all Snyk CLI commands and options, visit the [Snyk CLI Help documentation](https://docs.snyk.io/developer-tools/snyk-cli/commands).

---



