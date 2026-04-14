migrate(
  (app) => {
    try {
      const docs = app.findRecordsByFilter('document_resources', '1=1', '', 100, 0)
      const tags = app.findRecordsByFilter('tags', '1=1', '', 10, 0)

      if (tags.length > 0 && docs.length > 0) {
        for (let i = 0; i < Math.min(docs.length, 5); i++) {
          const doc = docs[i]
          if (!doc.get('tags') || doc.get('tags').length === 0) {
            doc.set('tags', [tags[i % tags.length].id])
            app.save(doc)
          }
        }
      }
    } catch (e) {}
  },
  (app) => {},
)
