migrate(
  (app) => {
    // 1. Create contract_templates
    const templatesCol = new Collection({
      name: 'contract_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_contract_templates_name ON contract_templates (name)'],
    })
    app.save(templatesCol)

    // 2. Create generated_contracts
    const generatedCol = new Collection({
      name: 'generated_contracts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'template',
          type: 'relation',
          required: true,
          collectionId: templatesCol.id,
          maxSelect: 1,
        },
        { name: 'client_name', type: 'text', required: true },
        { name: 'address', type: 'text', required: false },
        { name: 'value', type: 'number', required: false },
        { name: 'deadline', type: 'text', required: false },
        { name: 'final_content', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_generated_contracts_template ON generated_contracts (template)'],
    })
    app.save(generatedCol)

    // 3. Seed default templates
    try {
      const template1 = new Record(templatesCol)
      template1.set('name', 'Prestação de Serviço de Engenharia')
      template1.set(
        'content',
        'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ENGENHARIA\n\nPelo presente instrumento particular, de um lado, TOZZI ENGENHARIA, doravante denominada CONTRATADA, inscrita no CNPJ sob o nº 00.000.000/0001-00, e de outro lado {{cliente}}, doravante denominado(a) CONTRATANTE.\n\n1. OBJETO\nO presente contrato tem como objeto a execução de obras e/ou elaboração de projetos de engenharia no seguinte local: {{endereco}}.\n\n2. REMUNERAÇÃO\nPela execução dos serviços objeto deste contrato, a CONTRATANTE obriga-se a pagar à CONTRATADA o valor de {{valor}}, conforme cronograma físico-financeiro anexo.\n\n3. PRAZO DE EXECUÇÃO\nA CONTRATADA compromete-se a concluir a obra/projeto no prazo de {{prazo}}, contados da data de emissão da Ordem de Serviço ou assinatura deste.\n\n4. RESPONSABILIDADES\nA CONTRATADA assume total responsabilidade técnica pela execução dos serviços, comprometendo-se a observar as normas da ABNT e fornecer a respectiva ART (Anotação de Responsabilidade Técnica).\n\nE, por estarem justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma.\n\nData: [DATA_DA_ASSINATURA]\n\n_____________________________________________________\nTOZZI ENGENHARIA - CONTRATADA\n\n_____________________________________________________\n{{cliente}} - CONTRATANTE',
      )
      app.save(template1)

      const template2 = new Record(templatesCol)
      template2.set('name', 'Consultoria Técnica')
      template2.set(
        'content',
        'CONTRATO DE CONSULTORIA TÉCNICA\n\nPelo presente instrumento particular, de um lado, TOZZI ENGENHARIA, doravante denominada CONTRATADA, inscrita no CNPJ sob o nº 00.000.000/0001-00, e de outro lado {{cliente}}, doravante denominado(a) CONTRATANTE.\n\n1. OBJETO\nO presente contrato tem como objeto a prestação de serviços de consultoria técnica de engenharia no endereço: {{endereco}}.\n\n2. VALOR E CONDIÇÕES DE PAGAMENTO\nPelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de {{valor}}. O pagamento será realizado conforme condições acordadas previamente entre as partes.\n\n3. PRAZO\nOs serviços serão executados no prazo de {{prazo}}, contados a partir da assinatura deste instrumento. A prorrogação deste prazo poderá ocorrer mediante aditivo contratual.\n\n4. FORO\nAs partes elegem o foro da comarca atual para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.\n\nE, por estarem justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma.\n\nData: [DATA_DA_ASSINATURA]\n\n_____________________________________________________\nTOZZI ENGENHARIA - CONTRATADA\n\n_____________________________________________________\n{{cliente}} - CONTRATANTE',
      )
      app.save(template2)
    } catch (e) {
      console.log('Error seeding templates:', e)
    }
  },
  (app) => {
    try {
      const generatedCol = app.findCollectionByNameOrId('generated_contracts')
      app.delete(generatedCol)
    } catch (_) {}
    try {
      const templatesCol = app.findCollectionByNameOrId('contract_templates')
      app.delete(templatesCol)
    } catch (_) {}
  },
)
