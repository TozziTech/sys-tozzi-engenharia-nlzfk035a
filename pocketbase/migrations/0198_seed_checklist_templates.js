migrate((app) => {
  const templates = app.findCollectionByNameOrId('checklist_templates')

  const seed = [
    {
      name: 'Inspeção Estrutural',
      service_type: 'estrutural',
      items: [
        { name: 'Trena', category: 'medição', order: 1 },
        { name: 'Esclerômetro', category: 'medição', order: 2 },
        { name: 'Fissurômetro', category: 'medição', order: 3 },
        { name: 'Nível laser', category: 'medição', order: 4 },
        { name: 'Câmera', category: 'outro', order: 5 },
        { name: 'Caderno', category: 'outro', order: 6 },
      ],
    },
    {
      name: 'Inspeção Hidrossanitária',
      service_type: 'hidrossanitário',
      items: [
        { name: 'Manômetro', category: 'medição', order: 1 },
        { name: 'Termômetro infravermelho', category: 'medição', order: 2 },
        { name: 'Corante', category: 'outro', order: 3 },
        { name: 'Lanterna', category: 'acesso', order: 4 },
        { name: 'Chave grifo', category: 'outro', order: 5 },
      ],
    },
    {
      name: 'Inspeção Elétrica',
      service_type: 'elétrico',
      items: [
        { name: 'Multímetro', category: 'medição', order: 1 },
        { name: 'Alicate amperímetro', category: 'medição', order: 2 },
        { name: 'Chave de fenda isolada', category: 'segurança', order: 3 },
        { name: 'Luvas classe 0', category: 'segurança', order: 4 },
        { name: 'Lanterna de cabeça', category: 'acesso', order: 5 },
      ],
    },
  ]

  for (const t of seed) {
    try {
      app.findFirstRecordByData('checklist_templates', 'name', t.name)
    } catch (_) {
      const r = new Record(templates)
      r.set('name', t.name)
      r.set('service_type', t.service_type)
      r.set('items', t.items)
      app.save(r)
    }
  }
})
