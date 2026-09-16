import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Hq from './pages/Hq'
import Screen from './pages/Screen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hq" element={<Hq />} />
      <Route path="/screen" element={<Screen />} />
    </Routes>
  )
}
