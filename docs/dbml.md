# DBML

[TOC]

A ` ```dbml ` block is drawn directly from [DBML](https://dbml.dbdiagram.io/docs/), mermaid is not involved. Tables become cards with constraint chips, a non-public schema (or a `TableGroup`) gets a dashed box, and each `Ref` is a routed line from the foreign key to the column it points at. In fullscreen you can zoom and move like any other diagram. Hover a table, a column or a line and the links through it light up with a pulse, together with the key columns they join. Click a table for a popup with its columns, types, defaults, notes, indexes and relations (click a relation to jump to the other table).

## Shop

```dbml
Table customers {
  id uuid [pk]
  email text [unique, not null]
  created_at timestamptz [not null]
}

Table orders {
  id uuid [pk]
  customer_id uuid [not null]
  status text [not null]
  total numeric(12,2) [not null]
  placed_at timestamptz [not null]

  indexes {
    customer_id [name: 'idx_orders_customer_id']
    status [name: 'idx_orders_status']
  }
}

Table products [collapse: 4] {
  id uuid [pk]
  sku text [unique, not null]
  name text [not null]
  price numeric(12,2) [not null]
  description text
  created_at timestamptz
  archived boolean

  indexes {
    sku [unique, name: 'uq_products_sku']
  }
}

Table order_items [headercolor: #eb6c36] {
  id uuid [pk]
  order_id uuid [not null]
  product_id uuid [not null]
  qty integer [not null]
  unit_price numeric(12,2) [not null]
}

Table billing.invoices {
  id uuid [pk]
  order_id uuid [not null]
  issued_at timestamptz [not null]
}

Ref: orders.customer_id > customers.id [delete: restrict]
Ref: order_items.order_id > orders.id [delete: cascade]
Ref: order_items.product_id > products.id [delete: restrict]
Ref: billing.invoices.order_id > orders.id [delete: restrict]
```

## Settings

- `[pk]`, `[unique]`, `[not null]` become the `PK`, `UQ` and `NN` chips, a column on the many side of a `Ref` gets `FK`
- `[delete: cascade]` / `[update: ...]` on a `Ref` label the line, `cascade` draws it in the destructive colour
- `[headercolor: #eb6c36]` tints a table header
- `[collapse: 4]` (not part of DBML) shows the first 4 columns and folds the rest into `+ N more columns`
- `Enum` blocks are drawn as cards, a `TableGroup` draws a box around its tables

## Enum and TableGroup

```dbml
Enum order_status {
  pending
  paid
  shipped
}

Table users {
  id int [pk]
  name varchar(80) [not null]
}

Table posts {
  id int [pk]
  author_id int
  status order_status
}

Table comments {
  id int [pk]
  post_id int
  author_id int
}

TableGroup content {
  posts
  comments
}

Ref: posts.author_id > users.id
Ref: comments.post_id > posts.id
Ref: comments.author_id > users.id
```
