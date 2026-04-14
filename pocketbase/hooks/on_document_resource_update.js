onRecordAfterUpdateSuccess((e) => {
  const doc = e.record

  try {
    const favorites = $app.findRecordsByFilter(
      'user_document_favorites',
      'document_id = {:docId}',
      '',
      1000,
      0,
      { docId: doc.id },
    )

    if (favorites.length > 0) {
      const notifications = $app.findCollectionByNameOrId('notifications')

      for (const fav of favorites) {
        const userId = fav.get('user_id')
        const notif = new Record(notifications)
        notif.set('user', userId)
        notif.set('title', 'Documento Atualizado')
        notif.set('message', `O documento ${doc.get('title')} que você favoritou foi atualizado.`)
        notif.set('read', false)

        let category = doc.get('category')
        let link = '/files/library' // default fallback

        if (category === 'Biblioteca') link = '/files/library'
        else if (category === 'POPs') link = '/files/pops'
        else if (category === 'Projetos Base') link = '/files/base-projects'
        else if (category === 'Documentos Modelos') link = '/files/templates'
        else if (category === 'Cursos') link = '/files/courses'

        notif.set('link', link)
        $app.save(notif)
      }
    }
  } catch (err) {}

  e.next()
}, 'document_resources')
