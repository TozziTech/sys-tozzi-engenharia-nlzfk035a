migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    collection.fields.add(new TextField({ name: 'instagram' }))
    collection.fields.add(new TextField({ name: 'facebook' }))
    collection.fields.add(new TextField({ name: 'website' }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    collection.fields.removeByName('instagram')
    collection.fields.removeByName('facebook')
    collection.fields.removeByName('website')
    app.save(collection)
  },
)
