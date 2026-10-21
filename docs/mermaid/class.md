# Mermaid: Class Diagram

[TOC]

Laid out to the diagram-design UML class rules: at most 7 classes and 8 relationships per diagram, a few members per compartment, and the accent only on the focal class. Syntax coverage is split into small diagrams.

## Relationship vocabulary

All six relationships in one diagram. The focal class is `Animal`. Composition means the part dies with the whole, aggregation means it lives on its own.

```mermaid
classDiagram
  direction LR
  class Service {
    <<interface>>
    +run() void
  }
  class Animal {
    <<abstract>>
    +String name
    +eat(food) void
    +sleep() void
  }
  class Dog {
    +bark() void
  }
  class Leg {
    +int length
  }
  class Owner {
    +String name
  }
  class Food {
    +int calories
  }
  class Water {
    +int liters
  }
  Animal <|-- Dog : inheritance
  Service <|.. Animal : realization
  Animal *-- Leg : composition
  Animal o-- Owner : aggregation
  Animal "1" --> "0..*" Food : association
  Animal ..> Water : dependency
  cssClass "Animal" focal
```

| Relationship | Line | Ending | Syntax |
|---|---|---|---|
| Inheritance (extends) | solid | hollow triangle | `A <|-- B` |
| Realization (implements) | dashed | hollow triangle | `A <|.. B` |
| Composition (owns, cascades) | solid | filled diamond at the owner | `A *-- B` |
| Aggregation (has, independent) | solid | hollow diamond at the owner | `A o-- B` |
| Association | solid | open arrowhead, multiplicity at both ends | `A "1" --> "0..*" B` |
| Dependency (uses) | dashed | open arrowhead | `A ..> B` |

The focal class gets the tinted name compartment, and its inheritance and realization lines take the accent colour.

## Members and visibility

```mermaid
classDiagram
  class Account {
    +String id
    -double balance
    #String owner
    ~String branch
    +deposit(amount) void
    -audit() void
    #notify(message) void
    +open()$ Account
    +close()* void
  }
```

`+` public, `-` private, `#` protected, `~` package. A trailing `$` marks a static member and `*` an abstract one.

## Stereotypes

A stereotype only for the interfaces and abstract classes that need one.

```mermaid
classDiagram
  class Repository {
    <<interface>>
    +find(id) Entity
    +save(entity) void
  }
  class Entity {
    <<abstract>>
    +String id
  }
  class Status {
    <<enumeration>>
    ACTIVE
    ARCHIVED
  }
  class Mailer {
    <<service>>
    +send(mail) void
  }
```

## Generics

```mermaid
classDiagram
  class Box~T~ {
    +T value
    +get() T
    +map~R~(fn) Box~R~
  }
  class Stack~T~ {
    +List~T~ items
    +push(item) void
    +pop() T
  }
  Box~T~ <|-- Stack~T~
```

## Multiplicity and labels

```mermaid
classDiagram
  direction LR
  Customer "1" --> "0..*" Order : places
  Order "1" *-- "1..*" Line : contains
  Line "*" --> "1" Product : refers to
  Order "1" --> "0..1" Invoice
```

## Relationship kinds, all arrows

```mermaid
classDiagram
  direction LR
  A <|-- B : inheritance
  C *-- D : composition
  E o-- F : aggregation
  G --> H : association
  I -- J : link
  K ..> L : dependency
  M ..|> N : realization
  O .. P : dashed link
```

## Lollipop interface

```mermaid
classDiagram
  Class01 --() Interface01
  Class02 ()-- Interface02
```

## Direction

```mermaid
classDiagram
  direction TB
  class Base
  class Left
  class Right
  Base <|-- Left
  Base <|-- Right
```

## Notes

```mermaid
classDiagram
  class Dog {
    +bark() void
  }
  note "General note"
  note for Dog "Good boy"
```

## Namespaces

```mermaid
classDiagram
  namespace Pets {
    class Cat {
      +meow() void
    }
    class Bird {
      +fly() void
    }
  }
  namespace Farm {
    class Cow {
      +moo() void
    }
  }
  Cat --> Cow
```

## Interaction

```mermaid
classDiagram
  class Docs
  class Home
  click Docs href "https://example.com/docs" "Open the docs"
  link Home "https://example.com" "Open home"
  callback Docs "alertFn" "Tooltip"
```

## Styling

```mermaid
classDiagram
  class Hot
  class Cool
  Hot --> Cool
  cssClass "Hot" focal
  style Cool fill:#eee,stroke:#999
```

[← Back to index](../mermaid.md)
