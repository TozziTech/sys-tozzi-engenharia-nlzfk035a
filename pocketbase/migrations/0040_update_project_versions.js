migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('project_versions')

    // Update file field to be not required
    const fileField = collection.fields.getByName('file')
    if (fileField) {
      fileField.required = false
    }

    // Add revision field
    if (!collection.fields.getByName('revision')) {
      collection.fields.add(
        new TextField({
          name: 'revision',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_versions')

    const fileField = collection.fields.getByName('file')
    if (fileField) {
      fileField.required = true
    }

    const revisionField = collection.fields.getByName('revision')
    if (revisionField) {
      collection.fields.removeByName('revision')
    }

    app.save(collection)
  },
)
