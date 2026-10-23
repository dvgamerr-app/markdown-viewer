# Store Schema

Mock database schema for a sample online store, drawn from a ` ```dbml ` block.

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
}

Table products {
  id uuid [pk]
  sku text [unique, not null]
  name text [not null]
  price numeric(12,2) [not null]
}

Table order_items {
  id uuid [pk]
  order_id uuid [not null]
  product_id uuid [not null]
  qty integer [not null]
}

Table payments {
  id uuid [pk]
  order_id uuid [not null]
  provider text [not null]
  amount numeric(12,2) [not null]
}

Ref: orders.customer_id > customers.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id
Ref: payments.order_id - orders.id
```
