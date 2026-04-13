onRecordCreate((e) => {
  const status = e.record.get('status')
  const account = e.record.get('bank_account')

  if (!e.record.get('code')) {
    let maxNum = 0
    try {
      const result = new DynamicModel({ maxNum: 0 })
      $app
        .db()
        .newQuery(
          "SELECT IFNULL(MAX(CAST(SUBSTR(code, 5) AS INTEGER)), 0) as maxNum FROM financial_records WHERE code LIKE 'FIN-%'",
        )
        .one(result)
      maxNum = result.maxNum
    } catch (err) {
      console.log('Error finding max code', err)
    }
    const nextCode = 'FIN-' + String(maxNum + 1).padStart(3, '0')
    e.record.set('code', nextCode)
  }

  if (status === 'Pago' && account) {
    const amount = e.record.get('amount') || 0
    const type = e.record.get('type')
    const impact = type === 'Entrada' ? amount : -amount

    $app
      .db()
      .newQuery('UPDATE bank_accounts SET balance = balance + {:impact} WHERE id = {:id}')
      .bind({ impact, id: account })
      .execute()
  }

  e.next()
}, 'financial_records')
