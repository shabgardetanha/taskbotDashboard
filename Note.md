# TaskBot Standards Guardians Activation Guide

## Required GitHub Secrets

Add the following secrets to your GitHub repository settings:

- `SUPABASE_DB_URL`: PostgreSQL connection string for staging environment
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-only, keep in CI secrets)
- `GITHUB_TOKEN`: Standard GitHub Actions token

## Branch Protection Setup

Navigate to **Settings → Branches → Add rule**:

- **Branch name pattern**: `main` (or your production branch name)
- Enable **"Require status checks to pass before merging"**
- **Status check name**: `enforce-standards` (or the job name in your workflow)
- Optionally, enable **"Include administrators"**

## Cursor and Copilot Configuration

- Add `.cursor/rules/taskbot-persian.rules` file to the repository and notify the dev team to activate the Cursor rule in their editors
- Enable Copilot Review in repository settings and add its status check name to branch protection rules

## Local Testing

- For `check_indexes.sh`, you'll need access to the staging database
- Before merging, create a test PR with author `saoudrizwan.claude-dev` to run all checks

## Maintenance and Development

- If more precise metrics are needed (e.g., query counting), enable `pg_stat_statements` in staging or implement a query counter middleware
