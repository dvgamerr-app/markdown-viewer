# Mermaid: ZenUML

ZenUML is an external plugin (`@mermaid-js/mermaid-zenuml`) that the bundled Mermaid does not include, so this block is expected to show a parse error in the viewer.

```mermaid
zenuml
  title Order service
  @Actor Client
  @Database DB
  Client->OrderService.create(order) {
    DB.save(order)
    if (order.valid) {
      return "ok"
    } else {
      return "error"
    }
  }
```

[← Back to index](../mermaid.md)
