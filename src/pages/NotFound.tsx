import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-center">
      <h1>Page introuvable</h1>
      <p className="muted">Cette page n’existe pas ou a été déplacée.</p>
      <Link to="/" className="btn btn-gold">Retour à l’accueil</Link>
    </div>
  )
}
