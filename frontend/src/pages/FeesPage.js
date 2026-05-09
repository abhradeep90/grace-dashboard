import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feesApi, studentsApi, expensesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { 
  Plus, 
  Search,
  Edit2, 
  Trash2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Receipt,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'salary', label: 'Salary' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

export const FeesPage = () => {
  const [searchParams] = useSearchParams();
  
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('fees');
  const [showAddDialog, setShowAddDialog] = useState(searchParams.get('action') === 'add');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];
  
  const [formData, setFormData] = useState({
    student_id: searchParams.get('student') || '',
    amount: '100',
    due_date: new Date().toISOString().split('T')[0],
    period: `${currentMonth} ${currentYear}`,
    status: 'unpaid'
  });

  const [expenseFormData, setExpenseFormData] = useState({
    name: '',
    amount: '',
    category: 'rent',
    is_recurring: true,
    month: `${currentMonth} ${currentYear}`
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes, expensesRes] = await Promise.all([
        feesApi.getAll(),
        studentsApi.getAll(),
        expensesApi.getAll(),
      ]);
      setFees(feesRes.data);
      setStudents(studentsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getCategoryLabel = (value) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === value);
    return cat?.label || value;
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      await feesApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Fee added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add fee');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesApi.create({
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
      });
      toast.success('Fixed expense added successfully');
      setShowAddExpenseDialog(false);
      resetExpenseForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesApi.update(selectedExpense.id, {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
      });
      toast.success('Expense updated successfully');
      setShowEditExpenseDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expensesApi.delete(expenseId);
      toast.success('Expense deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      name: '',
      amount: '',
      category: 'rent',
      is_recurring: true,
      month: `${currentMonth} ${currentYear}`
    });
  };

  const openEditExpenseDialog = (expense) => {
    setExpenseFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      is_recurring: expense.is_recurring,
      month: expense.month
    });
    setSelectedExpense(expense);
    setShowEditExpenseDialog(true);
  };

  const handleEditFee = async (e) => {
    e.preventDefault();
    try {
      await feesApi.update(selectedFee.id, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Fee updated successfully');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update fee');
    }
  };

  const handleMarkPaid = async (feeId) => {
    try {
      await feesApi.markPaid(feeId);
      toast.success('Fee marked as paid');
      fetchData();
    } catch (error) {
      toast.error('Failed to mark fee as paid');
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return;
    try {
      await feesApi.delete(feeId);
      toast.success('Fee deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete fee');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '100',
      due_date: new Date().toISOString().split('T')[0],
      period: `${currentMonth} ${currentYear}`,
      status: 'unpaid'
    });
  };

  const openEditDialog = (fee) => {
    setFormData({
      student_id: fee.student_id,
      amount: fee.amount.toString(),
      due_date: fee.due_date,
      period: fee.period,
      status: fee.status
    });
    setSelectedFee(fee);
    setShowEditDialog(true);
  };

  // Filter fees
  const filteredFees = fees.filter(fee => {
    const studentName = getStudentName(fee.student_id).toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) ||
                          fee.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalFees = fees.length;
  const paidFees = fees.filter(f => f.status === 'paid');
  const unpaidFees = fees.filter(f => f.status === 'unpaid');
  const totalCollected = paidFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPending = unpaidFees.reduce((sum, f) => sum + f.amount, 0);
  const totalFixedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fees-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Fees & Expenses</h1>
          <p className="text-[#6B7280] mt-1">Manage student fees and fixed expenses</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="rounded-full"
            onClick={() => { resetExpenseForm(); setShowAddExpenseDialog(true); }}
            data-testid="add-expense-btn"
          >
            <Wallet className="w-4 h-4 mr-2" /> Add Fixed Expense
          </Button>
          <Button 
            className="rounded-full bg-[#2C3E50]"
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            data-testid="add-fee-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Student Fee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="stat-card" data-testid="stat-total-fees">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Records</p>
                <p className="stat-value text-2xl">{totalFees}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-collected">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Collected</p>
                <p className="stat-value text-2xl font-mono">₹{totalCollected.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-pending">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Pending</p>
                <p className="stat-value text-2xl font-mono">₹{totalPending.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-unpaid-count">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Unpaid Invoices</p>
                <p className="stat-value text-2xl">{unpaidFees.length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-fixed-expenses">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Fixed Expenses</p>
                <p className="stat-value text-2xl font-mono">₹{totalFixedExpenses.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Fees and Fixed Expenses */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="fees" data-testid="tab-student-fees">
            <DollarSign className="w-4 h-4 mr-2" /> Student Fees ({fees.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-fixed-expenses">
            <Receipt className="w-4 h-4 mr-2" /> Fixed Expenses ({expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Student Fees Tab */}
        <TabsContent value="fees">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <Input
                placeholder="Search by student or period..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-[#E5E5E0]"
                data-testid="search-fees-input"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
                <TabsTrigger value="unpaid" data-testid="filter-unpaid">Unpaid</TabsTrigger>
                <TabsTrigger value="paid" data-testid="filter-paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Fees List */}
          <Card className="border-[#E5E5E0]">
        <CardContent className="p-0">
          {filteredFees.length === 0 ? (
            <div className="empty-state py-12">
              <DollarSign className="empty-state-icon" strokeWidth={1} />
              <p className="empty-state-title">No fees found</p>
              <p className="empty-state-description">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try different search terms or filters' 
                  : 'Add fee entries to track payments'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-[#F0F0EB]">
                    <th>Student</th>
                    <th>Period</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} data-testid={`fee-row-${fee.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#2C3E50] rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{getStudentName(fee.student_id)}</span>
                        </div>
                      </td>
                      <td>{fee.period}</td>
                      <td className="font-mono text-sm">{fee.due_date}</td>
                      <td className="font-mono font-semibold">₹{fee.amount.toFixed(2)}</td>
                      <td>
                        <span className={fee.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
                          {fee.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          {fee.status === 'unpaid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs"
                              onClick={() => handleMarkPaid(fee.id)}
                              data-testid={`mark-paid-${fee.id}`}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(fee)}
                            data-testid={`edit-fee-${fee.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteFee(fee.id)}
                            data-testid={`delete-fee-${fee.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Fixed Expenses Tab */}
        <TabsContent value="expenses">
          <Card className="border-[#E5E5E0]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Fixed Monthly Expenses</CardTitle>
              <Button 
                size="sm"
                className="rounded-full bg-[#2C3E50]"
                onClick={() => { resetExpenseForm(); setShowAddExpenseDialog(true); }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No fixed expenses recorded</p>
                  <p className="text-sm mt-1">Add recurring expenses like rent, utilities, salary, etc.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-[#F0F0EB]">
                        <th>Name</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Period</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} data-testid={`expense-row-${expense.id}`}>
                          <td className="font-medium">{expense.name}</td>
                          <td>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {getCategoryLabel(expense.category)}
                            </span>
                          </td>
                          <td className="font-mono font-semibold">₹{expense.amount.toFixed(2)}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              expense.is_recurring 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {expense.is_recurring ? 'Monthly' : 'One-time'}
                            </span>
                          </td>
                          <td className="text-sm text-[#6B7280]">{expense.month}</td>
                          <td>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditExpenseDialog(expense)}
                                data-testid={`edit-expense-${expense.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteExpense(expense.id)}
                                data-testid={`delete-expense-${expense.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Fee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add Student Fee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFee} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(v) => setFormData({ ...formData, student_id: v })}
              >
                <SelectTrigger data-testid="fee-student-select">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  data-testid="fee-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  data-testid="fee-due-date-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period *</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., January 2025"
                required
                data-testid="fee-period-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#2C3E50]" 
                disabled={!formData.student_id}
                data-testid="save-fee-btn"
              >
                Add Fee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Fee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFee} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(v) => setFormData({ ...formData, student_id: v })}
              >
                <SelectTrigger data-testid="edit-fee-student-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount (₹) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  data-testid="edit-fee-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Due Date *</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  data-testid="edit-fee-due-date-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-period">Period *</Label>
                <Input
                  id="edit-period"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                  data-testid="edit-fee-period-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger data-testid="edit-fee-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="update-fee-btn">
                Update Fee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Fixed Expense Dialog */}
      <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add Fixed Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name *</Label>
              <Input
                id="expense-name"
                value={expenseFormData.name}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, name: e.target.value })}
                placeholder="e.g., Studio Rent, Electricity"
                required
                data-testid="expense-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount (₹) *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  required
                  data-testid="expense-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={expenseFormData.category} 
                  onValueChange={(v) => setExpenseFormData({ ...expenseFormData, category: v })}
                >
                  <SelectTrigger data-testid="expense-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-month">Period</Label>
              <Input
                id="expense-month"
                value={expenseFormData.month}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, month: e.target.value })}
                placeholder="e.g., January 2025 or Monthly"
                data-testid="expense-month-input"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F0F0EB] rounded-lg">
              <div>
                <Label htmlFor="recurring" className="font-medium">Recurring Monthly</Label>
                <p className="text-xs text-[#6B7280]">Same amount every month</p>
              </div>
              <Switch
                id="recurring"
                checked={expenseFormData.is_recurring}
                onCheckedChange={(v) => setExpenseFormData({ ...expenseFormData, is_recurring: v })}
                data-testid="expense-recurring-switch"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddExpenseDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="save-expense-btn">
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Fixed Expense Dialog */}
      <Dialog open={showEditExpenseDialog} onOpenChange={setShowEditExpenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Fixed Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-name">Expense Name *</Label>
              <Input
                id="edit-expense-name"
                value={expenseFormData.name}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, name: e.target.value })}
                required
                data-testid="edit-expense-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-amount">Amount (₹) *</Label>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  required
                  data-testid="edit-expense-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={expenseFormData.category} 
                  onValueChange={(v) => setExpenseFormData({ ...expenseFormData, category: v })}
                >
                  <SelectTrigger data-testid="edit-expense-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expense-month">Period</Label>
              <Input
                id="edit-expense-month"
                value={expenseFormData.month}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, month: e.target.value })}
                data-testid="edit-expense-month-input"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F0F0EB] rounded-lg">
              <div>
                <Label htmlFor="edit-recurring" className="font-medium">Recurring Monthly</Label>
                <p className="text-xs text-[#6B7280]">Same amount every month</p>
              </div>
              <Switch
                id="edit-recurring"
                checked={expenseFormData.is_recurring}
                onCheckedChange={(v) => setExpenseFormData({ ...expenseFormData, is_recurring: v })}
                data-testid="edit-expense-recurring-switch"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditExpenseDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="update-expense-btn">
                Update Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesPage;
