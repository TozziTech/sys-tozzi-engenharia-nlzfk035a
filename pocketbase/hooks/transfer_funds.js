routerAdd(
  'POST',
  '/backend/v1/bank-accounts/transfer',
  (e) => {
    const body = e.requestInfo().body
    const fromAccountId = body.from_account_id
    const toAccountId = body.to_account_id
    const amount = Number(body.amount)
    const date = body.date || new Date().toISOString().split('T')[0]
    const description = body.description || ''

    if (!fromAccountId || !toAccountId || isNaN(amount) || amount <= 0) {
      throw new BadRequestError('Invalid transfer parameters.')
    }

    $app.runInTransaction((txApp) => {
      const fromAccount = txApp.findRecordById('bank_accounts', fromAccountId)
      const toAccount = txApp.findRecordById('bank_accounts', toAccountId)

      fromAccount.set('balance', (fromAccount.get('balance') || 0) - amount)
      toAccount.set('balance', (toAccount.get('balance') || 0) + amount)

      txApp.save(fromAccount)
      txApp.save(toAccount)

      const financialRecordsCol = txApp.findCollectionByNameOrId('financial_records')

      const expense = new Record(financialRecordsCol)
      expense.set('description', description || `Transferência para ${toAccount.get('name')}`)
      expense.set('amount', amount)
      expense.set('type', 'Saída')
      expense.set('date', date)
      expense.set('status', 'Pago')
      expense.set('bank_account', fromAccountId)
      expense.set('reconciled', false)
      if (e.auth) {
        expense.set('responsible', e.auth.id)
      }
      txApp.save(expense)

      const income = new Record(financialRecordsCol)
      income.set('description', description || `Transferência de ${fromAccount.get('name')}`)
      income.set('amount', amount)
      income.set('type', 'Entrada')
      income.set('date', date)
      income.set('status', 'Pago')
      income.set('bank_account', toAccountId)
      income.set('reconciled', false)
      if (e.auth) {
        income.set('responsible', e.auth.id)
      }
      txApp.save(income)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
