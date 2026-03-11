'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { accountingApi, Expense } from '@/lib/api'

const frequencyLabels: Record<string, string> = {
  one_time: 'Одноразово',
  monthly: 'Щомісяця',
  quarterly: 'Щокварталу',
  yearly: 'Щорічно',
}

const categoryOptions = [
  'Оренда',
  'Обладнання',
  'Підписки',
  'Комунальні',
  'Податки',
  'Інше',
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formFrequency, setFormFrequency] = useState('monthly')
  const [formCategory, setFormCategory] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('')
  const [formEffectiveTo, setFormEffectiveTo] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const data = await accountingApi.getExpenses()
      setExpenses(data)
    } catch (err) {
      console.error('Error loading expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingExpense(null)
    setFormName('')
    setFormAmount('')
    setFormFrequency('monthly')
    setFormCategory('')
    setFormNotes('')
    setFormEffectiveFrom('')
    setFormEffectiveTo('')
    setDialogOpen(true)
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setFormName(expense.name)
    setFormAmount(expense.amount.toString())
    setFormFrequency(expense.frequency)
    setFormCategory(expense.category || '')
    setFormNotes(expense.notes || '')
    setFormEffectiveFrom(expense.effective_from || '')
    setFormEffectiveTo(expense.effective_to || '')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName || !formAmount) return

    setSaving(true)
    try {
      const data: any = {
        name: formName,
        amount: parseFloat(formAmount),
        frequency: formFrequency,
        category: formCategory || undefined,
        notes: formNotes || undefined,
        effective_from: formEffectiveFrom || undefined,
        effective_to: formEffectiveTo || undefined,
      }

      if (editingExpense) {
        await accountingApi.updateExpense(editingExpense.id, data)
      } else {
        await accountingApi.createExpense(data)
      }

      setDialogOpen(false)
      await loadExpenses()
    } catch (err) {
      console.error('Error saving expense:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await accountingApi.deleteExpense(id)
      await loadExpenses()
    } catch (err) {
      console.error('Error deleting expense:', err)
    }
  }

  const handleToggleActive = async (expense: Expense) => {
    try {
      await accountingApi.updateExpense(expense.id, { is_active: !expense.is_active })
      await loadExpenses()
    } catch (err) {
      console.error('Error toggling expense:', err)
    }
  }

  const totalMonthly = expenses
    .filter(e => e.is_active)
    .reduce((sum, e) => {
      if (e.frequency === 'monthly') return sum + Number(e.amount)
      if (e.frequency === 'quarterly') return sum + Number(e.amount) / 3
      if (e.frequency === 'yearly') return sum + Number(e.amount) / 12
      return sum
    }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Постійні витрати</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Оренда, підписки, обладнання та інші регулярні витрати
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-1">
          <Plus className="h-4 w-4" />
          Додати витрату
        </Button>
      </div>

      {/* Monthly summary */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <Receipt className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Загалом на місяць</p>
            <p className="text-xl font-bold tabular-nums">{totalMonthly.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн</p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Витрат поки немає</p>
          <Button variant="link" onClick={openCreateDialog}>Додати першу витрату</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense.id} className={expense.is_active ? '' : 'opacity-50'}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{expense.name}</span>
                    {expense.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {expense.category}
                      </span>
                    )}
                    {!expense.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Неактивна
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {frequencyLabels[expense.frequency] || expense.frequency}
                    {expense.notes && <span className="ml-2">— {expense.notes}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{Number(expense.amount).toLocaleString('uk-UA')} грн</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.frequency === 'monthly' ? '/міс' :
                     expense.frequency === 'quarterly' ? '/квартал' :
                     expense.frequency === 'yearly' ? '/рік' : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleActive(expense)}>
                    <div className={`h-3 w-3 rounded-full ${expense.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(expense)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Редагувати витрату' : 'Нова витрата'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Назва</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Оренда кабінету"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Сума (грн)</label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="5000"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Частота</label>
                <Select value={formFrequency} onValueChange={setFormFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Одноразово</SelectItem>
                    <SelectItem value="monthly">Щомісяця</SelectItem>
                    <SelectItem value="quarterly">Щокварталу</SelectItem>
                    <SelectItem value="yearly">Щорічно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Категорія</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Нотатки</label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Додаткова інформація"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Діє з</label>
                <Input
                  type="date"
                  value={formEffectiveFrom}
                  onChange={(e) => setFormEffectiveFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Діє до</label>
                <Input
                  type="date"
                  value={formEffectiveTo}
                  onChange={(e) => setFormEffectiveTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Скасувати</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formAmount}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingExpense ? 'Зберегти' : 'Створити'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
