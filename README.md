# lukecs

Personal site — Next.js 16.2 App Router, static export to GitHub Pages.

Use Node.js 24 (also used by CI).

## Space simulation

Planets, moons, and comets share a 2D, softened Newtonian gravity simulation (`src/lib/gravity.ts`). Mass scales with the planet artwork's area. A fixed 120 Hz velocity-Verlet step drives motion independently of rendering; initial orbital velocities are starting conditions, not enforced paths. Close encounters and escapes are allowed. There are no collision/merger rules or relativistic effects, and distances/masses use artistic units.

Scrolling moves the camera through document-space bodies. Escaped comets are recycled only beyond the world bounds; captured comets keep orbiting. Resizing the page width re-seeds the layout, while phone browser-chrome height changes do not. Reduced motion disables the simulation. Fiery trails are emitted from recorded physical positions, with ballistic embers that fade independently. Stars and nebulae remain decorative backgrounds, not massive bodies.

Planet artwork is served from `public/space/` at canvas resolution (384×192 terrain), losslessly encoded. Run `npm run assets:space` after changing the original artwork. Comet nuclei are generated and cached as pixel art. Visible planets share decoded textures and sphere projections; offscreen planets defer initialization. Layout anchors are cached until scrolling/resizing, and comet emission data is reused across frames.

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static site -> out/
npm run lint
```

## Blog

MDX posts live in `content/blog/`. Velite (`velite.config.ts`) validates frontmatter, compiles MDX, and emits typed data to `.velite/`. The build script sets production mode before generating content, then exports the site with Next's webpack builder. Drafts are excluded from production content and always excluded from RSS. MDX is trusted repository content, rendered server-side; embed interactive behavior in imported client components rather than hooks in the MDX body.

### Authoring workflow

1. **Create a post file** under `content/blog/` named `YYYY-MM-DD-slug.mdx`.

   ```bash
   $EDITOR content/blog/2026-04-24-hello-world.mdx
   ```

2. **Add frontmatter + body**:

   ```mdx
   ---
   title: Hello, world
   date: 2026-04-24
   tags: [meta, intro]
   summary: First post on the new MDX blog.
   draft: false
   ---

   # Hello, world

   Body is **MDX** — markdown plus JSX. Drop in components:

   <p style={{ color: "tomato" }}>Inline JSX works.</p>

   ## Code

   ```ts
   function greet(name: string) {
     return `hi, ${name}`;
   }
   ```
   ```

3. **Multimedia** — drop assets next to the slug under `public/blog/<slug>/`, reference with absolute paths:

   ```bash
   mkdir -p public/blog/hello-world
   cp ~/Downloads/cover.jpg public/blog/hello-world/cover.jpg
   ```

   ```mdx
   ![cover](/blog/hello-world/cover.jpg)
   ```

4. **Preview locally**:

   ```bash
   npm run dev
   # open http://localhost:3000/blog
   ```

   For live MDX reload while editing, in a second terminal:

   ```bash
   npm run dev:content
   ```

5. **Publish** — commit and push. GitHub Pages workflow rebuilds.

   ```bash
   git add content/blog/2026-04-24-hello-world.mdx public/blog/hello-world/
   git commit -m "post: hello world"
   git push
   ```

   Drafts: set `draft: true` in frontmatter. Drafts render in dev but get filtered out of production output.

### Frontmatter schema

| Field     | Type            | Required | Notes                                   |
|-----------|-----------------|----------|-----------------------------------------|
| `title`   | string ≤120     | yes      | Post title                              |
| `date`    | ISO date        | yes      | Publication date, used for sort + RSS   |
| `updated` | ISO date        | no       | Last edit                               |
| `tags`    | string[]        | no       | Drives `/blog/tags/<tag>` archives      |
| `summary` | string ≤280     | yes      | Shown on index + RSS                    |
| `cover`   | image path      | no       | Validated/copied by Velite              |
| `draft`   | boolean         | no       | Hidden from production builds           |

Schema lives in `velite.config.ts`. Edit there to add fields.

### Routes

- `/blog` — index, sorted by date desc
- `/blog/<slug>` — post page
- `/blog/tags/<tag>` — tag archive
- `/rss.xml` — RSS feed (regenerated on every build)

### Recommended editors

Any editor that handles MDX is fine:
- **VS Code** — install `unifiedjs.vscode-mdx`
- **Obsidian** — point a vault at `content/blog/`, use the Git plugin to commit
- **iA Writer** — open the `content/blog/` folder
