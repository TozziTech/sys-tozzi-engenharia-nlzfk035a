migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('contract_clauses')
    if (!collection.fields.getByName('tags')) {
      collection.fields.add(
        new RelationField({
          name: 'tags',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('tags').id,
          cascadeDelete: false,
          maxSelect: 2147483647,
        }),
      )
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contract_clauses')
    collection.fields.removeByName('tags')
    app.save(collection)
  },
)
