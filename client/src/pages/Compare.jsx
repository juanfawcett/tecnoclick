
import React, { useEffect, useState } from 'react'
import { Container, Table } from 'react-bootstrap'
import { api, CompareStore } from '../lib/api'

export default function Compare(){
  const [products, setProducts] = useState([])

  async function load(){
    const ids = CompareStore.all()
    if (ids.length === 0) { setProducts([]); return }
    const r = await api('/api/products/compare', { method:'POST', body:{ ids } })
    setProducts(r.products || [])
  }
  useEffect(()=>{ load(); const h = ()=>load(); window.addEventListener('compare:update', h); return ()=> window.removeEventListener('compare:update', h) }, [])

  if (!products.length) return <Container className="py-4"><p>No has agregado productos al comparador.</p></Container>

  return (
    <Container className="py-4">
      <h2>Comparar productos</h2>
      <Table bordered responsive className="table-dark-soft">
        <thead><tr><th>Atributo</th>{products.map(p=>(<th key={p.id}>{p.name}</th>))}</tr></thead>
        <tbody>
          <tr><td>Precio</td>{products.map(p=>(<td key={p.id}>{(p.price_cents/100).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td>))}</tr>
          <tr><td>Stock</td>{products.map(p=>(<td key={p.id}>{p.stock}</td>))}</tr>
          <tr><td>Categoría</td>{products.map(p=>(<td key={p.id}>{p.category||''}</td>))}</tr>
        </tbody>
      </Table>
    </Container>
  )
}
