import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { Composer, PostCard } from '../components/PostCard'
import { Empty, Spinner } from '../components/ui'
import { PageHero } from '../components/PageHero'

export default function Community() {
  const { user, settings } = useApp()
  const { data, loading, reload } = useLoad(() => api.listPosts(), [user?.id])

  return (
    <>
      <PageHero eyebrow="Communauté" title={`Le fil ${settings.name}`} text="Partagez vos looks, donnez votre avis et suivez les nouveautés du salon." />
      <div className="container page page-after-hero feed">
      {user ? (
        <Composer onPosted={reload} />
      ) : (
        <div className="card join-card">
          <div>
            <strong>Rejoignez la communauté</strong>
            <p className="muted small">Créez un compte gratuit pour publier, aimer et commenter.</p>
          </div>
          <Link to="/connexion?suite=/communaute" className="btn btn-gold btn-sm">S’inscrire</Link>
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon="users" title="Aucune publication pour l’instant" />
      ) : (
        data.map((p) => <PostCard key={p.id} post={p} onChange={reload} />)
      )}
      </div>
    </>
  )
}
