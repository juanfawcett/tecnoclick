
import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AuthPage(){
  const { login, register } = useAuth()
  const [lemail,setLEmail] = useState(''); const [lpass,setLPass]=useState('')
  const [name,setName] = useState(''); const [email,setEmail]=useState(''); const [pass,setPass]=useState('')
  const nav = useNavigate()

  async function doLogin(){ try{ await login(lemail, lpass); nav('/') } catch(e){ alert(e.message) } }
  async function doRegister(){ try{ await register({ name, email, password: pass }); nav('/') } catch(e){ alert(e.message) } }

  return (
    <Container className="py-4">
      <Row className="g-3">
        <Col md={6}>
          <Card className="card-tc"><Card.Body>
            <h4>Iniciar sesión</h4>
            <Form.Control className="mb-2" placeholder="Email" value={lemail} onChange={e=>setLEmail(e.target.value)}/>
            <Form.Control className="mb-2" type="password" placeholder="Contraseña" value={lpass} onChange={e=>setLPass(e.target.value)}/>
            <Button onClick={doLogin} className="btn-gradient">Entrar</Button>
          </Card.Body></Card>
        </Col>
        <Col md={6}>
          <Card className="card-tc"><Card.Body>
            <h4>Crear cuenta</h4>
            <Form.Control className="mb-2" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}/>
            <Form.Control className="mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <Form.Control className="mb-2" type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}/>
            <Button onClick={doRegister} className="btn-gradient">Registrar</Button>
          </Card.Body></Card>
        </Col>
      </Row>
    </Container>
  )
}
