# Mermaid: Entity Relationship Diagram

[TOC]

Laid out to the diagram-design ER rules: an entity is a two-part box with its name on top and its attributes below, key columns marked, and each relationship line carries its cardinality at both ends. Syntax coverage is split into small diagrams so each one stays readable. In fullscreen, click an entity to focus its relationships.

## Reference model

Four entities around one aggregate root. `CUSTOMER:::focal` puts the accent on the root and `LINE_ITEM:::join` draws a join table dashed.

```mermaid
erDiagram
  direction LR
  CUSTOMER:::focal {
    int id PK
    string name "Full name"
    string email UK
  }
  ORDER {
    int id PK
    int customer_id FK
    date created
    float total
  }
  LINE_ITEM:::join {
    int order_id PK, FK
    string sku PK, FK
    int quantity
  }
  PRODUCT {
    string sku PK
    string title
  }
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "ordered in"
```

## Cardinality

Each end of a line says how many, drawn as `1` for the one side (`||`, `|o`) and `N` for the many side (`}|`, `}o`).

```mermaid
erDiagram
  A ||--|| B : "one to one"
  A ||--o| C : "one to zero or one"
  A ||--|{ D : "one to many"
  A ||--o{ E : "one to zero or many"
```

## Identifying and non-identifying

A solid line identifies: the child cannot exist without the parent. A dashed line does not.

```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER }|..|{ ADDRESS : "lives at"
  PERSON |o--o| PASSPORT : holds
```

## Attributes and keys

Keys are `PK`, `FK` and `UK`, several can share one attribute, and a quoted string is the attribute comment.

```mermaid
erDiagram
  CAR ||--o{ NAMED_DRIVER : allows
  CAR {
    string registrationNumber PK
    string make
    string model "Trim level"
  }
  NAMED_DRIVER {
    string driverLicense PK, FK
    string name
  }
```

## Aliases

An entity can carry a readable name apart from its id.

```mermaid
erDiagram
  p[Person] {
    string firstName
    string lastName
  }
  a["Home Address"] {
    string street
    string city
  }
  p }o--|| a : "lives at"
```

[← Back to index](../mermaid.md)
