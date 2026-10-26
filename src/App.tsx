import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAdmin, RequireUser } from './components/Guards'
import Home from './pages/Home'
import Services from './pages/Services'
import Gallery from './pages/Gallery'
import Salon from './pages/Salon'
import Booking from './pages/Booking'
import Community from './pages/Community'
import Login from './pages/Login'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import Appointments from './admin/Appointments'
import ServicesAdmin from './admin/ServicesAdmin'
import GalleryAdmin from './admin/GalleryAdmin'
import PostsAdmin from './admin/PostsAdmin'
import SettingsAdmin from './admin/SettingsAdmin'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="prestations" element={<Services />} />
        <Route path="galerie" element={<Gallery />} />
        <Route path="salon" element={<Salon />} />
        <Route path="reserver" element={<Booking />} />
        <Route path="communaute" element={<Community />} />
        <Route path="connexion" element={<Login />} />
        <Route path="mon-espace" element={<RequireUser><Account /></RequireUser>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="rendez-vous" element={<Appointments />} />
        <Route path="prestations" element={<ServicesAdmin />} />
        <Route path="coiffures" element={<GalleryAdmin />} />
        <Route path="publications" element={<PostsAdmin />} />
        <Route path="parametres" element={<SettingsAdmin />} />
      </Route>
    </Routes>
  )
}
