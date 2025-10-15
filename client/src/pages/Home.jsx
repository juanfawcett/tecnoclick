import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { api, track } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const q = params.get('q') || '';

  useEffect(() => {
    (async () => {
      const r = await api(
        `${process.env.API_URL}/api/` + encodeURIComponent(q)
      );
      setProducts(r.products || []);
      track('view_home', { q });
    })();
  }, [q]);

  return (
    <Container className="py-4">
      <div className="p-4 rounded-4 mb-4 card-tc">
        <h1 className="display-5">
          Encuentra tu próxima{' '}
          <span className="brand-gradient">tecnología</span>
        </h1>
        <p className="text-secondary mb-0">
          Compra como invitado o crea tu cuenta para acceder a favoritos,
          reseñas y <b>Plan Separe</b>.
        </p>
      </div>
      <Row xs={1} sm={2} md={3} className="g-4">
        {products.map((p) => (
          <Col key={p.id}>
            <ProductCard p={p} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
