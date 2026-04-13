onRecordUpdate((e) => {
  const oldData = new DynamicModel({
    amount: 0.0,
    type: '',
    status: '',
    bank_account: '',
  })

  let hasOldData = false
  try {
    $app
      .db()
      .newQuery('SELECT amount, type, status, bank_account FROM financial_records WHERE id = {:id}')
      .bind({ id: e.record.id })
      .one(oldData)
    hasOldData = true
  } catch (err) {
    // Record might not exist yet or no rows returned
  }

  if (hasOldData) {
    const oldStatus = oldData.status
    const oldAccount = oldData.bank_account
    const oldAmount = oldData.amount || 0
    const oldType = oldData.type

    // Revert previous impact if it was "Pago"
    if (oldStatus === 'Pago' && oldAccount) {
      const revertImpact = oldType === 'Entrada' ? -oldAmount : oldAmount
      $app
        .db()
        .newQuery('UPDATE bank_accounts SET balance = balance + {:impact} WHERE id = {:id}')
        .bind({ impact: revertImpact, id: oldAccount })
        .execute()
    }
  }

  const newStatus = e.record.get('status')
  const newAccount = e.record.get('bank_account')
  const newAmount = e.record.get('amount') || 0
  const newType = e.record.get('type')

  // Apply new impact if "Pago"
  if (newStatus === 'Pago' && newAccount) {
    const applyImpact = newType === 'Entrada' ? newAmount : -newAmount
    $app
      .db()
      .newQuery('UPDATE bank_accounts SET balance = balance + {:impact} WHERE id = {:id}')
      .bind({ impact: applyImpact, id: newAccount })
      .execute()
  }

  e.next()
}, 'financial_records')
