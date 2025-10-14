
import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap'
import { api, fmtCOP } from '../lib/api'

export default function Admin(){
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [sku,setSku]=useState(''); const [name,setName]=useState(''); const [price,setPrice]=useState(''); const [stock,setStock]=useState(''); const [cat,setCat]=useState(''); const [desc,setDesc]=useState('')
  const [ccode,setCcode]=useState(''); const [ckind,setCkind]=useState('percent'); const [cval,setCval]=useState('')

  async function load(){
    const ps = await api('/api/products'); setProducts(ps.products||[])
    try{ const cs = await api('/api/coupons'); setCoupons(cs.coupons||[]) }catch{}
  }
  useEffect(()=>{ load() }, [])

  async function saveProduct(){
    await api('/api/products', { method:'POST', body:{ sku, name, price_cents:Number(price), stock:Number(stock), category:cat, description:desc, images:[] } })
    setSku(''); setName(''); setPrice(''); setStock(''); setCat(''); setDesc(''); load()
  }
  async function saveCoupon(){
    await api('/api/coupons', { method:'POST', body:{ code: ccode, kind: ckind, value: Number(cval) } })
    setCcode(''); setCkind('percent'); setCval(''); load()
  }

  return (
    <Container className="py-4">
      <h2>Admin</h2>
      <Row className="g-3">
        <Col md={6}>
          <Card className="card-tc"><Card.Body>
            <h5>Productos</h5>
            <div className="mb-3" style={{maxHeight:260, overflow:'auto'}}>
              <Table size="sm" bordered className="table-dark-soft">
                <thead><tr><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
                <tbody>{products.map(p=>(<tr key={p.id}><td>{p.name}</td><td>{fmtCOP(p.price_cents)}</td><td>{p.stock}</td></tr>))}</tbody>
              </Table>
            </div>
            <h6>Nuevo/Editar</h6>
            <div className="row g-2">
              <div className="col-md-4"><Form.Control placeholder="SKU" value={sku} onChange={e=>setSku(e.target.value)}/></div>
              <div className="col-md-8"><Form.Control placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}/></div>
              <div className="col-md-4"><Form.Control placeholder="Precio (centavos)" value={price} onChange={e=>setPrice(e.target.value)}/></div>
              <div className="col-md-4"><Form.Control placeholder="Stock" value={stock} onChange={e=>setStock(e.target.value)}/></div>
              <div className="col-md-4"><Form.Control placeholder="Categoría" value={cat} onChange={e=>setCat(e.target.value)}/></div>
              <div className="col-12"><Form.Control as="textarea" rows={2} placeholder="Descripción" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
            </div>
            <div className="d-flex mt-2"><Button className="btn-gradient ms-auto" onClick={saveProduct}>Guardar</Button></div>
          </Card.Body></Card>
        </Col>
        <Col md={6}>
          <Card className="card-tc"><Card.Body>
            <h5>Cupones</h5>
            <div className="mb-3" style={{maxHeight:260, overflow:'auto'}}>
              <Table size="sm" bordered className="table-dark-soft">
                <thead><tr><th>Código</th><th>Tipo</th><th>Valor</th></tr></thead>
                <tbody>{coupons.map(c=>(<tr key={c.id}><td>{c.code}</td><td>{c.kind}</td><td>{c.value}</td></tr>))}</tbody>
              </Table>
            </div>
            <h6>Nuevo cupón</h6>
            <div className="row g-2">
              <div className="col-md-4"><Form.Control placeholder="Código" value={ccode} onChange={e=>setCcode(e.target.value)}/></div>
              <div className="col-md-4">
                <Form.Select value={ckind} onChange={e=>setCkind(e.target.value)}>
                  <option value="percent">% Porcentaje</option>
                  <option value="fixed">Fijo (centavos)</option>
                </Form.Select>
              </div>
              <div className="col-md-4"><Form.Control placeholder="Valor" value={cval} onChange={e=>setCval(e.target.value)}/></div>
            </div>
            <div className="d-flex mt-2"><Button className="btn-gradient ms-auto" onClick={saveCoupon}>Guardar</Button></div>
          </Card.Body></Card>
        </Col>
      </Row>
    </Container>
  )
}
