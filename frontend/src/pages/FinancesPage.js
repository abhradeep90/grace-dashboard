import { useState, useEffect } from 'react';
import { expensesApi, financesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PiggyBank,
  Receipt,
  Edit2,
  Trash2,
  IndianRupee,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

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

const COLORS = ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const FinancesPage = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];
  
  const [formData, setFormData] = useState({
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
      const [summaryRes, monthlyRes, breakdownRes, expensesRes] = await Promise.all([
        financesApi.getSummary(),
        financesApi.getMonthly(),
        financesApi.getExpenseBreakdown(),
        expensesApi.getAll(),
      ]);
      setSummary(summaryRes.data);
      setMonthlyData(monthlyRes.data);
      setExpenseBreakdown(breakdownRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesApi.update(selectedExpense.id, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense updated successfully');
      setShowEditDialog(false);
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

  const handleExportExcel = async () => {
    try {
      toast.loading('Generating Excel report...');
      const response = await financesApi.exportExcel();
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GraceMusicAcademy_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Excel report downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export report');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'rent',
      is_recurring: true,
      month: `${currentMonth} ${currentYear}`
    });
  };

  const openEditDialog = (expense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      is_recurring: expense.is_recurring,
      month: expense.month
    });
    setSelectedExpense(expense);
    setShowEditDialog(true);
  };

  const formatCurrency = (value) => {
    return `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const getCategoryLabel = (value) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === value);
    return cat?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  const isProfit = (summary?.net_profit || 0) >= 0;

  return (
    <div className="space-y-6" data-testid="finances-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Finances</h1>
          <p className="text-[#6B7280] mt-1">Track income, expenses, and profit</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="rounded-full"
            onClick={handleExportExcel}
            data-testid="export-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export to Excel
          </Button>
          <Button 
            className="rounded-full bg-[#2C3E50]"
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            data-testid="add-expense-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card" data-testid="stat-total-income">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Income</p>
                <p className="stat-value text-2xl font-mono text-green-600">
                  {formatCurrency(summary?.total_income)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-pending-income">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Pending Income</p>
                <p className="stat-value text-2xl font-mono text-amber-600">
                  {formatCurrency(summary?.pending_income)}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-total-expenses">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Expenses</p>
                <p className="stat-value text-2xl font-mono text-red-600">
                  {formatCurrency(summary?.total_expenses)}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-net-profit">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Net Profit</p>
                <p className={`stat-value text-2xl font-mono ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary?.net_profit)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isProfit ? 'bg-green-100' : 'bg-red-100'}`}>
                {isProfit ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses Chart */}
        <Card className="border-[#E5E5E0]" data-testid="monthly-chart">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#6B7280]">
                <p>No data available. Add fees and expenses to see the chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E0' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="border-[#E5E5E0]" data-testid="expense-breakdown-chart">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#6B7280]">
                <p>No expenses recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${getCategoryLabel(category)} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit Trend Chart */}
      {monthlyData.length > 0 && (
        <Card className="border-[#E5E5E0]" data-testid="profit-trend-chart">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Net Profit"
                  stroke="#2C3E50" 
                  fill="#2C3E50" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card className="border-[#E5E5E0]" data-testid="expenses-list">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Fixed Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No expenses recorded yet.</p>
              <p className="text-sm">Add your fixed expenses like rent, utilities, etc.</p>
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
                        <span className="px-2 py-1 bg-[#F0F0EB] rounded-full text-xs">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="font-mono font-semibold">{formatCurrency(expense.amount)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          expense.is_recurring 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.is_recurring ? 'Recurring' : 'One-time'}
                        </span>
                      </td>
                      <td className="text-sm text-[#6B7280]">{expense.month}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(expense)}
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

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Expense Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Studio Rent"
                required
                data-testid="expense-name-input"
              />
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
                  data-testid="expense-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
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
              <Label htmlFor="month">Period</Label>
              <Input
                id="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                placeholder="e.g., January 2025 or Monthly"
                data-testid="expense-month-input"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F0F0EB] rounded-lg">
              <div>
                <Label htmlFor="recurring" className="font-medium">Recurring Expense</Label>
                <p className="text-xs text-[#6B7280]">Applied to all months</p>
              </div>
              <Switch
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(v) => setFormData({ ...formData, is_recurring: v })}
                data-testid="expense-recurring-switch"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="save-expense-btn">
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Expense Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="edit-expense-name-input"
              />
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
                  data-testid="edit-expense-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
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
              <Label htmlFor="edit-month">Period</Label>
              <Input
                id="edit-month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                data-testid="edit-expense-month-input"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F0F0EB] rounded-lg">
              <div>
                <Label htmlFor="edit-recurring" className="font-medium">Recurring Expense</Label>
                <p className="text-xs text-[#6B7280]">Applied to all months</p>
              </div>
              <Switch
                id="edit-recurring"
                checked={formData.is_recurring}
                onCheckedChange={(v) => setFormData({ ...formData, is_recurring: v })}
                data-testid="edit-expense-recurring-switch"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
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

export default FinancesPage;
