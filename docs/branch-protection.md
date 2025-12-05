Branch Protection (Recommended settings for main):

1. Require status checks to pass before merging:

   - taskbot/enforce-standards (from workflow enforce-taskbot-standards.yml)
   - any other CI checks (lint, tests)

2. Require pull request reviews before merging:

   - Require approvals: 1
   - Include administrators: checked

3. Restrict who can push to matching branches:

   - Allow only specific users/teams (optional)

4. Require signed commits (optional)

After setting, any PR that fails the required checks cannot be merged.
