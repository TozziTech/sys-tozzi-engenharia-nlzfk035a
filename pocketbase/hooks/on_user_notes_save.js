onRecordValidate((e) => {
  const content = e.record.get('content')
  const richContent = e.record.get('rich_content')

  if (content && content !== richContent) {
    e.record.set('rich_content', content)
  }

  if (richContent && richContent !== content) {
    e.record.set('content', richContent)
  }

  e.next()
}, 'user_notes')
