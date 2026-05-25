onRecordValidate((e) => {
  const content = e.record.get('content')
  const richContent = e.record.get('rich_content')

  if (content && content !== richContent) {
    e.record.set('rich_content', content)
  }

  if (richContent && richContent !== content) {
    e.record.set('content', richContent)
  }

  if (e.record.isNew()) {
    const ordem = e.record.get('ordem')
    if (!ordem || ordem <= 0) {
      const projectId = e.record.get('project')
      if (projectId) {
        try {
          const records = $app.findRecordsByFilter(
            'user_notes',
            `project = '${projectId}'`,
            '-ordem',
            1,
            0,
          )
          if (records.length > 0) {
            e.record.set('ordem', (records[0].get('ordem') || 0) + 1)
          } else {
            e.record.set('ordem', 1)
          }
        } catch (_) {
          e.record.set('ordem', 1)
        }
      } else {
        e.record.set('ordem', 1)
      }
    }
  }

  e.next()
}, 'user_notes')
