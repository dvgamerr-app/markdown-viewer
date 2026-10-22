# Mermaid: User Journey

[TOC]

Drawn to the diagram-design journey map rules: one stage per task in a column, a sentiment curve through five named levels (`LOW` to `HIGH`, scores 1 to 5), the lowest stage and the segment leading into it in the accent, and no emoji. A section becomes a label over its stages, the actors of a task sit under its stage. At most 6 stages per journey reads best. In fullscreen, hover a stage to light its curve segments, click it for a popup, and press play to walk the journey from the first stage to the last.

## Reference journey

Five stages for one persona, with the trough at "Hit the limit".

```mermaid
journey
  title Trial to paid: the first week
  section Discover
    Sign up: 4: Visitor
    Follow the tour: 5: Visitor
  section Evaluate
    Invite a teammate: 4: Visitor, Teammate
    Hit the limit: 1: Visitor
  section Decide
    Upgrade: 3: Visitor, Finance
```

## Without sections or actors

Tasks need only a name and a score. With no section there is no label strip, with no actors there is no actors row.

```mermaid
journey
  title Checking out
  Find the product: 4
  Add to cart: 5
  Enter the address: 2
  Pay: 3
  Get the receipt: 5
```

## One level throughout

When every stage feels the same there is no lowest point to point at, so nothing takes the accent.

```mermaid
journey
  title A steady day
  section Morning
    Wake up: 3: Me
    Commute: 3: Me
  section Afternoon
    Work: 3: Me
    Go home: 3: Me
```

## Long names

Stage names wrap to three lines at most and end in an ellipsis after that.

```mermaid
journey
  title Onboarding a new engineer
  section Week one
    Get a laptop, an account on every system and a seat near the team: 2: Engineer, IT
    Read the architecture notes: 3: Engineer
    Ship a first small fix: 5: Engineer, Mentor
```

## Comments and accessibility lines

`%%` comments, `accTitle` and `accDescr` are accepted and ignored by the map.

```mermaid
journey
  %% a comment
  accTitle: Support request
  accDescr: A customer asks for help
  title Support request
  section Ask
    Open a ticket: 3: Customer
    Wait for a reply: 2: Customer
  section Resolve
    Get an answer: 5: Customer, Agent
```

[← Back to index](../mermaid.md)
