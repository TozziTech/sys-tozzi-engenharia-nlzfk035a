migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    const responsibleField = col.fields.getByName('responsible')
    if (responsibleField) {
      col.fields.removeByName('responsible')
    }

    if (!col.fields.getByName('attachments')) {
      col.fields.add(
        new FileField({
          name: 'attachments',
          maxSelect: 99,
          maxSize: 5242880,
          mimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/zip',
            'application/x-zip-compressed',
          ],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    if (!col.fields.getByName('responsible')) {
      const usersCol = app.findCollectionByNameOrId('users')
      col.fields.add(
        new RelationField({
          name: 'responsible',
          collectionId: usersCol.id,
          maxSelect: 1,
        }),
      )
    }

    const attachmentsField = col.fields.getByName('attachments')
    if (attachmentsField) {
      col.fields.removeByName('attachments')
    }

    app.save(col)
  },
)
