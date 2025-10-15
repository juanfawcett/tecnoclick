import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Form,
  Card,
} from 'react-bootstrap';
import { api, fmtCOP, track, CompareStore } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  async function load() {
    const { product } = await api(`${process.env.API_URL}/api/` + id);
    setProduct(product);
    const r = await api(`/api/products/${id}/reviews`);
    setReviews(r.reviews || []);
    track('view_product', { id: Number(id) });
  }
  useEffect(() => {
    load();
  }, [id]);

  async function addCart() {
    await api(`${process.env.API_URL}/api/`, {
      method: 'POST',
      body: { product_id: Number(id), qty: 1 },
    });
    window.dispatchEvent(new Event('cart:update'));
    track('add_to_cart', { product_id: Number(id) });
  }
  async function buyNow() {
    await addCart();
    navigate('/checkout');
  }
  async function fav() {
    try {
      await api(`${process.env.API_URL}/api/` + id, { method: 'POST' });
    } catch (e) {
      alert('Requiere iniciar sesión');
    }
  }
  function addCompare() {
    CompareStore.add(Number(id));
  }
  async function createLayaway() {
    try {
      await api(`${process.env.API_URL}/api/`, {
        method: 'POST',
        body: { product_id: Number(id), deposit_percent: 20, installments: 3 },
      });
      alert('Plan Separe creado');
    } catch (e) {
      alert('Requiere iniciar sesión');
    }
  }
  async function postReview() {
    try {
      await api(`/api/products/${id}/reviews`, {
        method: 'POST',
        body: { rating: Number(rating), comment },
      });
      setComment('');
      setRating(5);
      load();
    } catch (e) {
      alert('Inicia sesión para reseñar');
    }
  }

  if (!product) return <Container className="py-4">Cargando...</Container>;
  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={6}>
          <img
            className="img-fluid rounded-4"
            src={(product.images && product.images[0]) || '/assets/logo.svg'}
          />
        </Col>
        <Col md={6}>
          <h2 className="mb-1">{product.name}</h2>
          <p className="text-secondary">{product.description}</p>
          <div className="d-flex align-items-center gap-2 mb-3">
            <Badge bg="info">{fmtCOP(product.price_cents)}</Badge>
            {product.category && (
              <span className="badge text-bg-secondary">
                {product.category}
              </span>
            )}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button onClick={addCart} className="btn-gradient">
              Añadir al carrito
            </Button>
            <Button onClick={buyNow} variant="outline-light">
              Comprar ahora
            </Button>
            <Button onClick={fav} variant="outline-light">
              ❤️ Favorito
            </Button>
            <Button onClick={addCompare} variant="outline-light">
              🔍 Comparar
            </Button>
            <Button onClick={createLayaway} className="btn-gradient">
              Plan Separe
            </Button>
          </div>
        </Col>
      </Row>

      <h3 className="mt-5">Reseñas</h3>
      <Row className="g-3">
        {reviews.map((r) => (
          <Col key={r.id} md={6}>
            <Card className="card-tc">
              <Card.Body>
                <div className="fw-bold">
                  {r.user_name} — {'⭐'.repeat(r.rating)}
                </div>
                <div className="text-secondary">{r.comment}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="card-tc mt-4">
        <Card.Body>
          <h5>Escribir reseña</h5>
          <div className="d-flex gap-2">
            <Form.Select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{ maxWidth: 140 }}
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v} ⭐
                </option>
              ))}
            </Form.Select>
            <Form.Control
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tu opinión"
            />
            <Button onClick={postReview} className="btn-gradient">
              Publicar
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
