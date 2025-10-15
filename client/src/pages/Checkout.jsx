import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { api } from '../lib/api';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    country: 'CO',
  });
  const [billing, setBilling] = useState({
    street: '',
    city: '',
    country: 'CO',
  });
  const [coupon, setCoupon] = useState('');
  const [method, setMethod] = useState('card');

  async function pay() {
    try {
      const r = await api(`${import.meta.env.VITE_API_URL}/api/`, {
        method: 'POST',
        body: {
          email,
          shipping,
          billing,
          coupon_code: coupon || null,
          payment_method: method,
        },
      });
      if (r.status === 'under_review') {
        alert('Tu orden está en revisión.');
        return;
      }
      const p = await api(`${import.meta.env.VITE_API_URL}/api/`, {
        method: 'POST',
        body: { order_id: r.order_id, method },
      });
      window.location.href = p.redirect_url;
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <Container className="py-4">
      <h2>Checkout</h2>
      <Row className="g-3">
        <Col md={8}>
          <Card className="card-tc">
            <Card.Body>
              <h5>Datos</h5>
              <div className="row g-2">
                <div className="col-md-6">
                  <Form.Control
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <Form.Label className="mt-2">Envío</Form.Label>
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="Calle"
                    value={shipping.street}
                    onChange={(e) =>
                      setShipping({ ...shipping, street: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="Ciudad"
                    value={shipping.city}
                    onChange={(e) =>
                      setShipping({ ...shipping, city: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="País"
                    value={shipping.country}
                    onChange={(e) =>
                      setShipping({ ...shipping, country: e.target.value })
                    }
                  />
                </div>

                <div className="col-12">
                  <Form.Label className="mt-2">Facturación</Form.Label>
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="Calle"
                    value={billing.street}
                    onChange={(e) =>
                      setBilling({ ...billing, street: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="Ciudad"
                    value={billing.city}
                    onChange={(e) =>
                      setBilling({ ...billing, city: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Form.Control
                    placeholder="País"
                    value={billing.country}
                    onChange={(e) =>
                      setBilling({ ...billing, country: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <Form.Control
                    placeholder="Cupón (opcional)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <Form.Select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="card">Tarjeta</option>
                    <option value="pse">PSE</option>
                    <option value="wallet">Billetera</option>
                  </Form.Select>
                </div>
              </div>
              <div className="d-flex mt-3">
                <Button className="btn-gradient ms-auto" onClick={pay}>
                  Generar orden y pagar
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-tc">
            <Card.Body>
              <h5>Resumen</h5>
              <p className="text-secondary">
                Los detalles del carrito se muestran antes del pago en MockPay.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
