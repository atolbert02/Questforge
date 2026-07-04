Stage all modified tracked files, write a commit message based on the diff, commit, and push to origin main.

Steps:
1. Run `git status` and `git diff` in parallel to understand what changed
2. Run `git log --oneline -5` to match the existing commit message style
3. Stage modified tracked files: `git add -u`
4. Write a concise commit message (imperative mood, present tense, max 72 chars subject line) that describes WHY the change was made, not just what files changed
5. Commit using a heredoc so the message is formatted correctly, appending the co-author trailer: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
6. Push to origin main: `git push origin main`
7. Report the commit hash and push result

If there is nothing to commit (clean working tree), say so and skip.
Do not add untracked files — only stage files already tracked by git.
