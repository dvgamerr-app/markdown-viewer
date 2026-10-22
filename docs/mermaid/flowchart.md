# Mermaid: Flowchart

[TOC]

### Directions and node shapes

All 14 shape syntaxes in one chain. Node kinds use the viewer's diagram-design classes: `focal` (one only), `input`, `store`, `external`, `optional`, `security`.

```mermaid
flowchart TD
  A[Rectangle]:::input --> B(Rounded)
  B --> C([Stadium])
  C --> D[[Subroutine]]
  D --> E[(Database)]:::store
  E --> F((Circle)):::focal
  F --> G>Asymmetric]
  G --> H{Decision}
  H --> I{{Hexagon}}:::optional
  I --> J[/Parallelogram/]:::external
  J --> K[\Parallelogram alt\]
  K --> L[/Trapezoid\]
  L --> M[\Trapezoid alt/]
  M --> N(((Double circle))):::security
```

Shape carries type, as in the flowchart reference: stadium for start and end, rectangle for a step, diamond for a decision, labelled on every exit.

```mermaid
flowchart TD
  start([Start]) --> check{Valid input?}
  check -->|yes| work[Process request]:::focal
  check -->|no| fail[Show error]
  work --> save[(Save result)]:::store
  save --> done([End])
  fail --> done
```

### Directions

```mermaid
flowchart LR
  A([LR]) --> B[Step] --> C{Check} --> D([End])
```

```mermaid
flowchart RL
  A([RL]) --> B[Step] --> C{Check} --> D([End])
```

```mermaid
flowchart BT
  A([BT]) --> B[Step] --> C{Check} --> D([End])
```

```mermaid
flowchart TB
  A([TB]) --> B[Step] --> C{Check} --> D([End])
```

### Edge types and labels

```mermaid
flowchart LR
  A --> B
  A --- C
  A -- text --- D
  A -- text --> E
  A -->|pipe text| F
  A -.-> G
  A -. dotted text .-> H
  A ==> I
  A == thick text ==> J
  A ~~~ K
  A --o L
  A --x M
  A <--> N
  A o--o O
  A x--x P
  A -----> Q
  A --> B & C --> D
```

### Subgraphs, direction, styling, classes, click

```mermaid
flowchart TB
  subgraph one [Backend]
    direction LR
    api[API] --> db[(DB)]
  end
  subgraph two [Frontend]
    web[Web] --> app[App]
  end
  web --> api
  one --> two
  A[Styled]:::hot --> B[Class]:::cool
  style A fill:#f96,stroke:#333,stroke-width:3px,color:#000
  classDef hot fill:#f66,stroke:#900,color:#fff
  classDef cool fill:#69f,stroke:#039,color:#fff
  linkStyle 0 stroke:#f00,stroke-width:3px
  click A "https://example.com" "Open example" _blank
  click B callback "Tooltip"
```

### Markdown strings, unicode, new-style shape syntax

```mermaid
flowchart LR
  md["`**Bold** and *italic*
  second line`"]
  uni["Unicode ❤ สวัสดี 你好"]
  a@{ shape: rect, label: "Rect" }
  b@{ shape: rounded, label: "Rounded" }
  c@{ shape: diamond, label: "Diamond" }
  d@{ shape: cyl, label: "Cylinder" }
  e@{ shape: doc, label: "Document" }
  f@{ shape: hex, label: "Hexagon" }
  g@{ shape: cloud, label: "Cloud" }
  h@{ shape: bolt, label: "Bolt" }
  i@{ shape: fork, label: "Fork" }
  j@{ shape: sm-circ, label: "Small" }
  md --> uni --> a --> b --> c --> d --> e --> f --> g --> h --> i --> j
```

### Edge IDs and animation

```mermaid
flowchart LR
  A e1@--> B
  B e2@==> C
  e1@{ animate: true }
  e2@{ animation: slow }
```

[← Back to index](../mermaid.md)
