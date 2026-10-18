import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { errorMessage, timeAgo } from '../lib/utils'
import type { Post } from '../types'
import { Icon } from './Icon'
import { Avatar, Img } from './ui'

export function PostCard({ post, onChange }: { post: Post; onChange: () => void }) {
  const { user, toast } = useApp()
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length <= 2)
  const [comment, setComment] = useState('')
  const [liked, setLiked] = useState(post.liked_by_me)
  const [likes, setLikes] = useState(post.like_count)
  const canDelete = user && (user.id === post.author.id || user.role === 'admin')

  async function like() {
    if (!user) return toast('Connectez-vous pour aimer une publication.', 'error')
    setLiked(!liked)
    setLikes((n) => n + (liked ? -1 : 1))
    try {
      await api.toggleLike(post.id)
    } catch (e) {
      setLiked(liked)
      setLikes(post.like_count)
      toast(errorMessage(e), 'error')
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    try {
      await api.addComment(post.id, text)
      setComment('')
      setShowComments(true)
      onChange()
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  async function remove() {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      await api.deletePost(post.id)
      toast('Publication supprimée')
      onChange()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function removeComment(id: string) {
    try {
      await api.deleteComment(id)
      onChange()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <article className="card post">
      <header className="post-head">
        <Avatar name={post.author.full_name} url={post.author.avatar_url} />
        <div className="post-meta">
          <strong>
            {post.author.full_name}
            {post.author.role === 'admin' && <span className="badge-salon">Salon</span>}
          </strong>
          <span className="muted small">{timeAgo(post.created_at)}</span>
        </div>
        {canDelete && (
          <button className="icon-btn" onClick={remove} aria-label="Supprimer">
            <Icon name="trash" size={18} />
          </button>
        )}
      </header>
      {post.content && <p className="post-text">{post.content}</p>}
      {post.image_url && <Img src={post.image_url} alt="" className="post-img" />}
      <div className="post-actions">
        <button className={`action ${liked ? 'liked' : ''}`} onClick={like}>
          <Icon name="heart" size={20} /> {likes}
        </button>
        <button className="action" onClick={() => setShowComments((s) => !s)}>
          <Icon name="comment" size={20} /> {post.comments.length}
        </button>
      </div>
      {showComments && (
        <div className="comments">
          {post.comments.map((c) => (
            <div key={c.id} className="comment">
              <Avatar name={c.author.full_name} url={c.author.avatar_url} size={30} />
              <div className="comment-bubble">
                <strong>
                  {c.author.full_name}
                  {c.author.role === 'admin' && <span className="badge-salon">Salon</span>}
                </strong>
                <p>{c.content}</p>
                <span className="muted tiny">{timeAgo(c.created_at)}</span>
              </div>
              {user && (user.id === c.author.id || user.role === 'admin') && (
                <button className="icon-btn icon-btn-sm" onClick={() => removeComment(c.id)} aria-label="Supprimer le commentaire">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {user ? (
        <form className="comment-form" onSubmit={send}>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Écrire un commentaire…" maxLength={500} />
          <button className="btn btn-gold btn-sm" disabled={!comment.trim()}>Envoyer</button>
        </form>
      ) : (
        <p className="small muted comment-login"><Link to="/connexion?suite=/communaute">Connectez-vous</Link> pour commenter.</p>
      )}
    </article>
  )
}

export function Composer({ onPosted }: { onPosted: () => void }) {
  const { user, toast } = useApp()
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!user) return null

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    try {
      setImage(await api.uploadImage(f))
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !image) return
    setBusy(true)
    try {
      await api.createPost({ content: text.trim(), image_url: image })
      setText('')
      setImage(null)
      toast('Publication partagée !')
      onPosted()
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card composer" onSubmit={publish}>
      <div className="composer-top">
        <Avatar name={user.full_name || user.email} url={user.avatar_url} />
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Partagez votre nouvelle coiffure, un avis, une question…"
          maxLength={1000}
        />
      </div>
      {image && (
        <div className="composer-preview">
          <Img src={image} alt="Aperçu" />
          <button type="button" className="icon-btn" onClick={() => setImage(null)} aria-label="Retirer la photo"><Icon name="x" /></button>
        </div>
      )}
      <div className="composer-actions">
        <label className="btn btn-ghost btn-sm">
          <Icon name="image" size={18} /> Photo
          <input type="file" accept="image/*" hidden onChange={pick} />
        </label>
        <button className="btn btn-gold btn-sm" disabled={busy || (!text.trim() && !image)}>
          {busy ? 'Patientez…' : 'Publier'}
        </button>
      </div>
    </form>
  )
}
