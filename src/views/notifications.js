import { supabase } from '../lib/supabase.js'

/**
 * Store global des notifications — hydraté dans le store principal
 * Permet d'afficher un badge sur la bottom nav
 */
export async function fetchUnreadCount() {
  const me = window.Alpine.store('app').session?.user?.id
  if (!me) return 0
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', me)
    .eq('read', false)
  return count || 0
}

export const notificationsView = () => ({
  items: [],
  loading: true,

  async init() {
    await this.load()
    await this.markAllAsRead()
  },

  async load() {
    this.loading = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    // Jointure pour récupérer le pseudo de l'acteur
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, kind, read, created_at, top_list_id,
        actor:profiles!notifications_actor_id_fkey(id, username)
      `)
      .eq('recipient_id', me)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('notifications load error', error)
      this.items = []
    } else {
      this.items = data || []
    }
    this.loading = false
  },

  async markAllAsRead() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', me)
      .eq('read', false)
    // Rafraîchit le badge global
    if (window.Alpine.store('app').refreshUnreadCount) {
      window.Alpine.store('app').refreshUnreadCount()
    }
  },

  label(n) {
    const user = '@' + (n.actor?.username || 'quelqu\'un')
    switch (n.kind) {
      case 'new_top': return user + ' vient de publier un nouveau Top 3'
      case 'new_flop': return user + ' vient de publier un nouveau Flop 3'
      case 'like': return user + ' a aimé ton classement'
      case 'follow': return user + ' s\'est abonné à toi'
      default: return 'Nouvelle activité'
    }
  },

  href(n) {
    // Click sur une notif → va au profil de l'acteur
    return n.actor?.username ? '#/u/' + n.actor.username : '#/feed'
  },

  formatDate(iso) {
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return "à l'instant"
    if (diff < 3600) return Math.floor(diff / 60) + ' min'
    if (diff < 86400) return Math.floor(diff / 3600) + ' h'
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' j'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }
})
