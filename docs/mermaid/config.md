# Mermaid: Configuration, themes and comments

[TOC]

### Frontmatter title and config

```mermaid
---
title: Frontmatter title
config:
  theme: forest
  look: handDrawn
  flowchart:
    curve: stepBefore
---
flowchart LR
  A --> B --> C
```

### Layout engine (ELK)

```mermaid
---
config:
  layout: elk
  elk:
    mergeEdges: true
---
flowchart LR
  A --> B & C
  B --> D
  C --> D
```

### Theme variables (base theme)

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#ffdfd3"
    primaryTextColor: "#333"
    primaryBorderColor: "#eb6c36"
    lineColor: "#eb6c36"
    fontFamily: "monospace"
---
flowchart LR
  A[Custom theme] --> B[Variables]
```

### Directive (deprecated but still accepted)

```mermaid
%%{init: {"theme": "dark", "flowchart": {"htmlLabels": true}}}%%
flowchart LR
  A --> B
```

### Comments

```mermaid
flowchart LR
  %% This line is a comment and is ignored
  A --> B
  %% B --> C
  B --> D
```

### Themes side by side

```mermaid
---
config:
  theme: default
---
flowchart LR
  A[default] --> B
```

```mermaid
---
config:
  theme: neutral
---
flowchart LR
  A[neutral] --> B
```

```mermaid
---
config:
  theme: dark
---
flowchart LR
  A[dark] --> B
```

```mermaid
---
config:
  theme: forest
---
flowchart LR
  A[forest] --> B
```

```mermaid
---
config:
  theme: base
---
flowchart LR
  A[base] --> B
```

[← Back to index](../mermaid.md)
