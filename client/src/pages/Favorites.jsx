import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Favorites() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await api(`${import.meta.env.VITE_API_URL}/api/`);
        setItems(r.favorites || []);
      } catch {}
    })();
  }, []);
  return (
    <Container className="py-4">
      <h2>Favoritos</h2>
      <Row xs={1} sm={2} md={3} className="g-4">
        {items.map((p) => (
          <Col key={p.id}>
            <ProductCard p={p} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
