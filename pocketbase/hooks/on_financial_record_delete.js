onRecordDelete((e) => {
  const status = e.record.get('status')
  const account = e.record.get('bank_account')

  if (status === 'Pago' && account) {
    const amount = e.record.get('amount') || 0
    const type = e.record.get('type')
    const impact = type === 'Entrada' ? -amount : amount

    $app
      .db()
      .newQuery('UPDATE bank_accounts SET balance = balance + {:impact} WHERE id = {:id}')
      .bind({ impact, id: account })
      .execute()
  }

  e.next()
}, 'financial_records')
