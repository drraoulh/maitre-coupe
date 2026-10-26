import { api } from '../lib/client'
import { useLoad } from '../lib/useLoad'
import { Composer, PostCard } from '../components/PostCard'
import { Empty, Spinner } from '../components/ui'

export default function PostsAdmin() {
  const { data, loading, reload } = useLoad(() => api.listPosts())
  return (
    <div className="feed">
      <p className="muted">Publiez au nom du salon (nouveaux modèles, promotions, horaires exceptionnels), partagez-les sur WhatsApp ou Facebook, et modérez les publications des clients.</p>
      <Composer onPosted={reload} />
      {loading ? <Spinner /> : !data?.length ? <Empty icon="users" title="Aucune publication" /> : data.map((p) => <PostCard key={p.id} post={p} onChange={reload} />)}
    </div>
  )
}
