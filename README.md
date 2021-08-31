The exported Next.js site is served by GH pages from the gh-pages branch. To push updates:

1. Run `npm run build && npm run export`
2. Push to the gh-pages branch with `git subtree push --prefix out origin gh-pages`