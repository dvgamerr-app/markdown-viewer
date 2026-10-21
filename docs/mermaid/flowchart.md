# Mermaid: Flowchart

[TOC]

### Directions and node shapes

```mermaid
flowchart TD
  A[Rectangle] --> B(Rounded)
  B --> C([Stadium])
  C --> D[[Subroutine]]
  D --> E[(Database)]
  E --> F((Circle))
  F --> G>Asymmetric]
  G --> H{Decision}
  H --> I{{Hexagon}}
  I --> J[/Parallelogram/]
  J --> K[\Parallelogram alt\]
  K --> L[/Trapezoid\]
  L --> M[\Trapezoid alt/]
  M --> N(((Double circle)))
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
