'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Check, Clock, X, Plus, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { superadminApi, PaymentListItem, CompanyListItem } from '@/lib/superadmin-api'

const STATUS_ICONS: Record<string, typeof Check> = {
  pending: Clock,
  completed: Check,
  failed: X,
  refunded: X,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  refunded: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([])
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await superadminApi.getPayments({
        status_filter: statusFilter || undefined,
      })
      setPayments(data)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const data = await superadminApi.getCompanies({ limit: 100 })
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  useEffect(() => {
    loadPayments()
    loadCompanies()
  }, [])

  useEffect(() => {
    loadPayments()
  }, [statusFilter])

  const handleCreatePayment = async () => {
    if (!selectedCompany || !amount) return

    setCreating(true)
    try {
      await superadminApi.createPayment({
        company_id: parseInt(selectedCompany),
        amount: Math.round(parseFloat(amount) * 100), // Convert to kopecks
        notes: notes || undefined,
        auto_complete: true,
      })
      setDialogOpen(false)
      setSelectedCompany('')
      setAmount('')
      setNotes('')
      loadPayments()
    } catch (error) {
      console.error('Error creating payment:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCompletePayment = async (paymentId: number) => {
    try {
      await superadminApi.completePayment(paymentId)
      loadPayments()
    } catch (error) {
      console.error('Error completing payment:', error)
    }
  }

  const formatCurrency = (kopecks: number) => {
    return (kopecks / 100).toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-slate-400 mt-1">View and manage platform payments</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Record Manual Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Amount (UAH)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Notes (optional)</Label>
                <Textarea
                  placeholder="Payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 bg-slate-700 border-slate-600"
                />
              </div>
              <Button
                onClick={handleCreatePayment}
                disabled={!selectedCompany || !amount || creating}
                className="w-full bg-amber-500 hover:bg-amber-600"
              >
                {creating ? 'Creating...' : 'Record Payment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const StatusIcon = STATUS_ICONS[payment.status] || Clock
            return (
              <Card key={payment.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${STATUS_COLORS[payment.status]?.split(' ')[0]}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{payment.company_name}</h3>
                          <Badge className={STATUS_COLORS[payment.status]}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{formatDate(payment.created_at)}</p>
                        {payment.notes && (
                          <p className="text-sm text-slate-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-slate-400">{payment.payment_method}</p>
                      </div>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleCompletePayment(payment.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
