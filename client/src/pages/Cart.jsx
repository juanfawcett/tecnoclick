import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Form } from 'react-bootstrap';
import { api, fmtCOP } from '../lib/api';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [totText, setTotText] = useState('');
  const [coupon, setCoupon] = useState('');

  async function load() {
    const r = await api(`${import.meta.env.VITE_API_URL}/api/cart`);
    setItems(r.items || []);
    const sum = r.items.reduce(
      (s, i) => s + i.discounted_price_cents * i.qty,
      0
    );
    setTotText('Total parcial: ' + fmtCOP(sum));
  }
  useEffect(() => {
    load();
  }, []);

  async function removeItem(id) {
    await api(`${import.meta.env.VITE_API_URL}/api/cart/items/` + id, {
      method: 'DELETE',
    });
    await load();
    window.dispatchEvent(new Event('cart:update'));
  }
  async function applyCup() {
    try {
      const r = await api(
        `${import.meta.env.VITE_API_URL}/api/cart/apply-coupon`,
        {
          method: 'POST',
          body: { code: coupon.trim() },
        }
      );
      setTotText(
        `Subtotal: ${fmtCOP(r.totals.subtotal)} | Desc: -${fmtCOP(
          r.totals.discount
        )} | IVA: ${fmtCOP(r.totals.tax)} | Total: ${fmtCOP(r.totals.total)}`
      );
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <Container className="py-4">
      <h2>Carrito</h2>
      <Table bordered hover responsive className="table-dark-soft">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>{it.qty}</td>
              <td>{fmtCOP(it.discounted_price_cents)}</td>
              <td>{fmtCOP(it.discounted_price_cents * it.qty)}</td>
              <td>
                <Button
                  variant="outline-light"
                  onClick={() => removeItem(it.id)}
                >
                  Quitar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="d-flex gap-2 align-items-center">
        <Form.Control
          placeholder="Cupón de descuento"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <Button onClick={applyCup} className="btn-gradient">
          Aplicar cupón
        </Button>
        <div className="ms-auto fw-bold">{totText}</div>
      </div>
      <div className="d-flex mt-3">
        <Button href="/checkout" className="btn-gradient ms-auto">
          Proceder al pago
        </Button>
      </div>
    </Container>
  );
}
