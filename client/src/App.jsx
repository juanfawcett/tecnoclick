
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import { AuthProvider } from './context/AuthContext'

import Home from './pages/Home'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Favorites from './pages/Favorites'
import Compare from './pages/Compare'
import AuthPage from './pages/Auth'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App(){
  return (
    <AuthProvider>
      <TopNav />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/producto/:id" element={<Product/>} />
        <Route path="/carrito" element={<Cart/>} />
        <Route path="/checkout" element={<Checkout/>} />
        <Route path="/favoritos" element={<Favorites/>} />
        <Route path="/comparar" element={<Compare/>} />
        <Route path="/auth" element={<AuthPage/>} />
        <Route path="/perfil" element={<Profile/>} />
        <Route path="/admin" element={<Admin/>} />
      </Routes>
      <footer className="py-5 text-center text-secondary">© {new Date().getFullYear()} TecnoClick — UI React + Bootstrap</footer>
    </AuthProvider>
  )
}
