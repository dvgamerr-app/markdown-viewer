# Build

Everything is one script, [build.mjs](build.mjs), run by bun. It builds the unpacked extension in `dist/nimbus-markdown/` (including `themes` and `vendor`) and the `dist/nimbus-markdown.zip` package. No `sh`, `bat`, `zip` or node is needed.

```bash
git clone https://github.com/dvgamerr-app/nimbus-markdown.git
cd nimbus-markdown/
bun i
bun run build:dist           # chrome
bun run build:dist:firefox   # firefox
bun run build:themes         # only rebuild dist/nimbus-markdown/themes
```

## Build Dependencies

- bun >= 1.1
- git (`cleanrmd` is installed from GitHub)

## nimbus-markdown Dependencies

| module | version
| :-     | -:
| bootstrap           | 5.3.3
| cleanrmd            | 0.1.0
| github-markdown-css | 5.5.1
| mathjax             | 3.2.2
| mermaid | 12.2.0
| mithril             | 1.1.7
| prismjs             | 1.29.0
| csso                | 5.0.5
| @panzoom/panzoom    | 4.5.1
| **markdown-it**
| markdown-it            | 13.0.1
| markdown-it-abbr       | 1.0.4
| markdown-it-anchor     | 8.6.7
| markdown-it-attrs      | 4.1.6
| markdown-it-cjk-breaks | 1.1.3
| markdown-it-deflist    | 2.1.0
| markdown-it-footnote   | 3.0.3
| markdown-it-ins        | 3.0.1
| markdown-it-mark       | 3.0.1
| markdown-it-sub        | 1.0.0
| markdown-it-sup        | 1.0.0
| markdown-it-task-lists | 2.1.1
| github-slugger         | 2.0.0
| **mdc**
| @material/button    | 0.37.1
| @material/ripple    | 0.37.1
| @material/switch    | 0.36.1
| @material/tabs      | 0.37.1
| @material/textfield | 0.37.1
