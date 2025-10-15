import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Navbar,
  Container,
  Nav,
  Badge,
  Form,
  Button,
  Dropdown,
} from 'react-bootstrap';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function TopNav() {
  const [count, setCount] = useState(0);
  const [q, setQ] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function refreshCount() {
    try {
      const r = await api(`${process.env.API_URL}/api/`);
      const c = r.items.reduce((s, i) => s + i.qty, 0);
      setCount(c);
    } catch {}
  }
  useEffect(() => {
    refreshCount();
    const onUpd = () => refreshCount();
    window.addEventListener('cart:update', onUpd);
    return () => window.removeEventListener('cart:update', onUpd);
  }, []);

  function search(e) {
    e.preventDefault();
    navigate('/?q=' + encodeURIComponent(q));
  }

  return (
    <Navbar
      bg="dark"
      data-bs-theme="dark"
      expand="lg"
      className="bg-dark-soft sticky-top border-bottom border-secondary-subtle"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span className="brand-gradient">TecnoClick</span>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Form className="d-flex ms-lg-3 me-auto" onSubmit={search}>
            <Form.Control
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Buscar productos..."
              className="me-2"
            />
            <Button type="submit" className="btn-gradient">
              Buscar
            </Button>
          </Form>
          <Nav className="align-items-center">
            <Nav.Link as={Link} to="/favoritos">
              ❤️ Favoritos
            </Nav.Link>
            <Nav.Link as={Link} to="/comparar">
              🔍 Comparar
            </Nav.Link>
            <Nav.Link as={Link} to="/carrito">
              🛒 Carrito <Badge bg="info">{count}</Badge>
            </Nav.Link>
            {!user ? (
              <Button as={Link} to="/auth" className="ms-2 btn-gradient">
                Entrar
              </Button>
            ) : (
              <Dropdown className="ms-2">
                <Dropdown.Toggle variant="outline-light">
                  {user.name || user.email}
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item as={Link} to="/perfil">
                    Perfil
                  </Dropdown.Item>
                  {user.role === 'admin' && (
                    <Dropdown.Item as={Link} to="/admin">
                      Admin
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={logout}>Salir</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
