# Mermaid: Sequence Diagram

[TOC]

Laid out to the diagram-design sequence rules: at most 5 lifelines and 12 messages per diagram, one combined fragment, calls solid and returns dashed. Syntax coverage is split into small diagrams so each one stays readable.

## Reference flow

Five lifelines, ten messages, one `alt` fragment. The happy-path return is the headline message.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant W as Web
  participant A as API
  participant DB as Database
  participant Q as Queue
  U->>W: Submit order
  W->>+A: POST /orders
  A->>+DB: INSERT order
  DB-->>-A: row id
  alt stock available
    A-)Q: publish order.created
    A-->>-W: 201 Created
    W-->>U: Confirmation
  else out of stock
    A-->>W: 409 Conflict
    W-->>U: Out of stock
  end
```

## Message kinds

Call is solid with a filled head, return is dashed with a filled head, async is dashed with an open head.

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Call (sync)
  S-->>C: Return
  C-)S: Async, fire and forget
  C->S: Solid line, no head
  C-->S: Dashed line, no head
  C-xS: Lost message
  C--xS: Lost message, dashed
  C<<->>S: Bidirectional
  C<<-->>S: Bidirectional, dashed
```

## Participants

```mermaid
sequenceDiagram
  participant A as Alias name
  actor U as User actor
  participant B@{ "type": "boundary" }
  participant C@{ "type": "control" }
  participant E@{ "type": "entity" }
  participant D@{ "type": "database" }
  participant Q@{ "type": "queue" }
  participant L@{ "type": "collections" }
  U->>B: request
  B->>C: route
  C->>E: load
  E->>D: query
  D-->>E: rows
  C-)Q: notify
  C-)L: log
```

## Activation

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  participant DB as Database
  C->>+S: request
  S->>+DB: query
  DB-->>-S: rows
  S->>+S: self call
  S-->>-S: self return
  S-->>-C: response
```

Explicit `activate` and `deactivate`:

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: start
  activate S
  S->>S: work
  S-->>C: done
  deactivate S
```

## Notes

```mermaid
sequenceDiagram
  participant U as User
  participant S as Server
  Note right of U: Right note
  Note left of S: Left note
  Note over U,S: Note spanning both
  U->>S: message
  Note over S: Note over one
  S->>S: line one<br/>line two
```

## Combined fragments

### alt and opt

```mermaid
sequenceDiagram
  participant U as User
  participant S as Server
  alt token valid
    U->>S: GET /me
    S-->>U: 200 profile
  else token expired
    S-->>U: 401
  end
  opt remember me
    S-->>U: set cookie
  end
```

### loop

```mermaid
sequenceDiagram
  participant W as Worker
  participant Q as Queue
  loop retry up to 3
    W->>Q: poll
    Q-->>W: job or empty
  end
```

### par, critical and break

Outside the skill's single-fragment budget: kept here only to exercise the syntax.

```mermaid
sequenceDiagram
  participant S as Server
  participant DB as Database
  participant Q as Queue
  par write
    S->>DB: save
  and publish
    S->>Q: enqueue
  end
  critical connect
    S->>DB: open
  option timeout
    S->>S: retry
  end
  break fatal
    S-->>S: abort
  end
```

### rect highlight

```mermaid
sequenceDiagram
  participant A as A
  participant B as B
  rect rgba(0, 0, 0, 0.05)
    A->>B: highlighted block
    B-->>A: reply
  end
  A->>B: outside
```

## Create and destroy

A created participant needs a message right after `create`; a destroyed one needs `destroy` right before its last message.

```mermaid
sequenceDiagram
  participant S as Server
  create participant M as Mailer
  S->>M: send mail
  destroy M
  M-->>S: delivered
```

## Grouping with box

```mermaid
sequenceDiagram
  participant U as User
  box Backend
    participant A as API
    participant DB as Database
  end
  U->>A: request
  A->>DB: query
  DB-->>A: rows
  A-->>U: response
```

## Links

```mermaid
sequenceDiagram
  participant A as API
  participant D as Docs
  link A: Dashboard @ https://example.com/dashboard
  links D: {"Wiki": "https://example.com/wiki", "Repo": "https://example.com/repo"}
  A->>D: reference
```

## Title and numbering

```mermaid
sequenceDiagram
  title Token refresh
  autonumber 10 5
  participant C as Client
  participant A as Auth
  C->>A: refresh token
  A-->>C: new access token
  autonumber off
  C->>A: no number here
```

## Text formatting

```mermaid
sequenceDiagram
  participant A as A
  participant B as B
  A->>B: Line break<br/>second line
  B-->>A: Entities #9829; and #35;
  A->>B: Semicolon #59; in text
  Note over A,B: Bold <b>text</b>, italic <i>text</i>
```
