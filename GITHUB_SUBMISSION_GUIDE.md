# GitHub submission guide

GitHub publishing must be done from the student's GitHub account. The source folder
is already arranged so generated files and `.env.local` remain private.

## 1. Inspect the folder before publishing

In VS Code, open this folder and confirm these are present:

- `src`, `supabase`, `scripts`, `data`, `testing`, and `docs`
- `package.json`, `package-lock.json`, `README.md`, and `.gitignore`

Confirm `.env.local` is dimmed/ignored by Git and never stage it.

## 2. Create an empty repository on GitHub

1. Sign in to GitHub.
2. Select **New repository**.
3. Repository name: `orbit-ocrs`.
4. Description: `Role-based Online Course Registration System using Next.js and local Supabase`.
5. Select **Public**, unless the faculty specifically accepts a private shared repo.
6. Do not add a README, `.gitignore`, or licence on GitHub because they already exist locally.
7. Select **Create repository**.

## 3. Publish from the VS Code terminal

Replace `YOUR-GITHUB-USERNAME` with the account name shown on GitHub:

```bash
cd "/Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission"
git init
git branch -M main
git add .
git status
git commit -m "Final Orbit OCRS project submission"
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/orbit-ocrs.git
git push -u origin main
```

At `git status`, stop if `.env.local`, `node_modules`, `.next`, `supabase/.temp`,
or any secret key appears. The expected result is source code and documentation only.

## 4. Verify the public repository

1. Refresh the repository page on GitHub.
2. Confirm the README appears automatically.
3. Open `src`, `supabase/migrations`, `data`, `testing`, and `docs`.
4. Use GitHub search for `SUPABASE_SECRET_KEY=`. Only a placeholder should exist in
   `.env.local.example`; a real value must never appear.
5. Copy the final repository URL for Appendix A of the report.
6. Open the URL in a private/incognito window to confirm the faculty can access it.

## Screenshots for the report

- `G01-github-repository-home.png`: repository name, Public badge, files, and README heading.
- `G02-github-source-tree.png`: expanded `src`, `supabase`, `testing`, and `docs` structure.
- `G03-github-incognito-check.png`: public repository opened while signed out.

Do not include account notifications, access tokens, private email, or browser password
manager pop-ups in screenshots.
