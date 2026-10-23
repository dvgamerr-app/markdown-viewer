// assembles the GitHub Pages site into _site: the landing page, its media and the live demo
// usage: bun run build:dist && bun scripts/site.mjs [outdir]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = process.argv[2] || join(root, '_site')
const dist = join(root, 'dist', 'nimbus-markdown')
if (!existsSync(join(dist, 'content', 'mermaid.js'))) {
  console.error('dist/nimbus-markdown is missing, run bun run build:dist first')
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'screenshots'), { recursive: true })
cpSync(join(root, 'site'), out, { recursive: true })

const shots = join(root, 'docs', 'screenshots')
readdirSync(shots)
  .filter((name) => /^0.*\.png$|^fullscreen-.*\.mp4$|^poster-.*\.jpg$/.test(name))
  .forEach((name) => cpSync(join(shots, name), join(out, 'screenshots', name)))
cpSync(join(root, 'icons', 'default', '128x128.png'), join(out, 'icon.png'))
cpSync(join(root, 'docs', 'store', 'marquee-promo-1400x560.png'), join(out, 'og.png'))

// the demo runs the built extension renderer unchanged: the same files background/inject.js injects for mermaid
const ext = join(out, 'demo', 'ext')
;[
  'content/index.css', 'content/themes.css', 'themes/nimbus.css', 'themes/nimbus-dark.css',
  'vendor/mermaid.min.js', 'vendor/panzoom.min.js',
  ...['draw', 'dbml', 'journey', 'timeline', 'gantt', 'pie', 'quadrant', 'requirement', 'gitgraph', 'c4', 'mindmap', 'mermaid']
    .map((name) => `content/${name}.js`)
].forEach((file) => {
  mkdirSync(dirname(join(ext, file)), { recursive: true })
  cpSync(join(dist, file), join(ext, file))
})
console.log(`site assembled in ${out}`)
