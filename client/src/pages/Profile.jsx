
import React, { useEffect, useState } from 'react'
import { Container, Card, Form, Button } from 'react-bootstrap'
import { api } from '../lib/api'

export default function Profile(){
  const [name,setName]=useState(''); const [address,setAddress]=useState({})
  useEffect(()=>{ (async()=>{ try{ const { user } = await api('/api/auth/profile'); setName(user.name||''); setAddress(user.address||{}) }catch{}})() },[])
  async function save(){ try{ await api('/api/auth/profile',{ method:'PUT', body:{ name, address } }); alert('Actualizado') } catch(e){ alert(e.message) } }
  return (
    <Container className="py-4">
      <h2>Perfil</h2>
      <Card className="card-tc"><Card.Body>
        <Form.Control className="mb-2" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <Form.Control as="textarea" rows={5} className="mb-2" placeholder="Dirección (JSON)" value={JSON.stringify(address)} onChange={e=>{ try{ setAddress(JSON.parse(e.target.value||'{}')) }catch{} }} />
        <Button onClick={save} className="btn-gradient">Guardar</Button>
      </Card.Body></Card>
    </Container>
  )
}
