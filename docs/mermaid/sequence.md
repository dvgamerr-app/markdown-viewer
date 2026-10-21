# Mermaid: Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  title Checkout flow
  participant U as User
  actor A as Admin
  participant S as Server
  box rgb(220,235,255) Backend
    participant DB as Database
    participant Q as Queue
  end
  create participant M as Mailer
  U->>S: POST /order
  activate S
  S->>+DB: INSERT order
  DB-->>-S: ok
  S-)Q: publish event
  S-xU: rejected (demo)
  S-->>U: 201 Created
  deactivate S
  destroy M
  S->>M: send mail
  Note right of U: Right note
  Note left of S: Left note
  Note over U,S: Spanning note
  loop Every minute
    S->>DB: heartbeat
  end
  alt success
    S->>U: OK
  else failure
    S->>U: Error
  end
  opt Optional
    U->>A: ping
  end
  par Branch A
    S->>DB: write
  and Branch B
    S->>Q: enqueue
  end
  critical Establish connection
    S->>DB: connect
  option Network timeout
    S->>S: retry
  end
  break When fatal
    S->>U: abort
  end
  rect rgb(200, 255, 200)
    U->>S: highlighted
  end
  S->>S: self call
  U-->>A: dotted open
  U->>A: solid arrow
  U-->>A: dotted arrow
  U-->A: dotted line
  U--)A: dotted async
  link U: Docs @ https://example.com
```

[← Back to index](../mermaid.md)
