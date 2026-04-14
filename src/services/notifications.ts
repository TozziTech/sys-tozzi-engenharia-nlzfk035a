import pb from '@/lib/pocketbase/client'

export interface AppNotification {
  id: string
  user: string
  title: string
  message: string
  read: boolean
  link: string
  created: string
  updated: string
}

export const getMyNotifications = () => {
  if (!pb.authStore.record) return Promise.resolve([])
  return pb.collection('notifications').getFullList<AppNotification>({
    filter: `user = "${pb.authStore.record.id}"`,
    sort: '-created',
  })
}

export const markNotificationAsRead = (id: string) => {
  return pb.collection('notifications').update(id, { read: true })
}

export const markAllNotificationsAsRead = async () => {
  if (!pb.authStore.record) return
  const unread = await pb.collection('notifications').getFullList({
    filter: `user = "${pb.authStore.record.id}" && read = false`,
  })
  await Promise.all(unread.map((n) => pb.collection('notifications').update(n.id, { read: true })))
}
