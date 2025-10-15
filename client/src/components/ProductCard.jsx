import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, fmtCOP, track, CompareStore } from '../lib/api';

export default function ProductCard({ p }) {
  async function add() {
    await api(`${import.meta.env.VITE_API_URL}/api/`, {
      method: 'POST',
      body: { product_id: p.id, qty: 1 },
    });
    window.dispatchEvent(new Event('cart:update'));
    track('add_to_cart', { product_id: p.id });
  }
  function compare() {
    CompareStore.add(p.id);
  }
  return (
    <Card className="card-tc h-100">
      <Card.Img
        variant="top"
        src={(p.images && p.images[0]) || '/assets/logo.svg'}
        style={{ objectFit: 'cover', height: 180 }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex justify-content-between">
          <span>{p.name}</span>
          <Badge bg="info">{fmtCOP(p.price_cents)}</Badge>
        </Card.Title>
        <Card.Text className="text-secondary flex-grow-1">
          {p.description}
        </Card.Text>
        <div className="d-flex gap-2">
          <Button as={Link} to={`/producto/${p.id}`} variant="outline-light">
            Ver
          </Button>
          <Button onClick={add} className="btn-gradient">
            Añadir
          </Button>
          <Button onClick={compare} variant="outline-light">
            Comparar
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
