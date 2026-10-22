# Mermaid: State Diagram

[TOC]

Laid out to the diagram-design state-machine rules: states are rounded boxes, the start is a filled dot and the end a ringed dot, every transition is labelled with the event that triggers it, and the one state the reader should notice takes the accent. Syntax coverage is split into small diagrams so each one stays readable. In fullscreen, press play to walk the transitions in order.

## Reference flow

Five states, one rejection loop. `class Published focal` puts the accent on the happy-path outcome.

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Draft : create
  Draft --> InReview : submit
  InReview --> Draft : reject
  InReview --> Published : approve
  Published --> Archived : expire
  Archived --> [*] : purge
  class Published focal
```

## Names and notes

`state "..." as id` gives a state a readable name, a note pins a remark to the side of a state.

```mermaid
stateDiagram-v2
  direction LR
  state "Waiting for payment" as Pending
  [*] --> Pending : checkout
  Pending --> Paid : charge ok
  Pending --> Failed : charge declined
  Paid --> [*]
  note right of Pending : expires after 30 minutes
  class Paid focal
```

## Choice

A `<<choice>>` diamond routes one event to different outcomes by guard.

```mermaid
stateDiagram-v2
  direction LR
  state check <<choice>>
  [*] --> Validating : upload
  Validating --> check
  check --> Accepted : valid
  check --> Rejected : invalid
  Accepted --> [*]
  Rejected --> [*]
  class Accepted focal
```

## Fork and join

A `<<fork>>` bar starts parallel work and a `<<join>>` bar waits for all of it.

```mermaid
stateDiagram-v2
  direction LR
  state fork <<fork>>
  state join <<join>>
  [*] --> Received : order
  Received --> fork
  fork --> Packing : pick
  fork --> Billing : invoice
  Packing --> join
  Billing --> join
  join --> Shipped : dispatch
  Shipped --> [*]
  class Shipped focal
```

## Composite state

A composite state holds its own small machine. Transitions can enter and leave the box as a whole.

```mermaid
stateDiagram-v2
  [*] --> Idle : boot
  Idle --> Session : sign in
  state Session {
    [*] --> Browsing
    Browsing --> Editing : open
    Editing --> Browsing : close
  }
  Session --> Idle : sign out
  Idle --> [*] : shutdown
```

## Concurrent regions

`--` splits a composite state into regions that run side by side.

```mermaid
stateDiagram-v2
  state Playback {
    [*] --> Playing
    Playing --> Paused : pause
    Paused --> Playing : play
    --
    [*] --> Muted
    Muted --> Loud : unmute
    Loud --> Muted : mute
  }
  [*] --> Playback : open
  Playback --> [*] : quit
```

## Legacy keyword

`stateDiagram` without `-v2` still renders.

```mermaid
stateDiagram
  [*] --> Still
  Still --> Moving
  Moving --> Crash
  Crash --> [*]
```

[← Back to index](../mermaid.md)
