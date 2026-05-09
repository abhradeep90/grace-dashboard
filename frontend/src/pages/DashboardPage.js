import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, feesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  ArrowRight,
  Music,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, lessonsRes, feesRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getUpcomingLessons(),
        dashboardApi.getPendingFees(),
      ]);
      setStats(statsRes.data);
      setUpcomingLessons(lessonsRes.data);
      setPendingFees(feesRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (feeId) => {
    try {
      await feesApi.markPaid(feeId);
      toast.success('Fee marked as paid');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to mark fee as paid');
    }
  };

  const getDayLabel = (daysFromNow) => {
    if (daysFromNow === 0) return 'Today';
    if (daysFromNow === 1) return 'Tomorrow';
    return `In ${daysFromNow} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Welcome back! Here's your academy overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card" data-testid="stat-total-students">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Total Students</p>
                <p className="stat-value">{stats?.total_students || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-weekly-lessons">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Weekly Lessons</p>
                <p className="stat-value">{stats?.total_lessons || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-unpaid-fees">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Unpaid Fees</p>
                <p className="stat-value">{stats?.unpaid_fees_count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-pending-amount">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">Pending Amount</p>
                <p className="stat-value font-mono">₹{stats?.total_unpaid_amount?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Lessons & Pending Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons */}
        <Card className="border-[#E5E5E0]" data-testid="upcoming-lessons-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading text-xl">Upcoming Lessons</CardTitle>
            <Link to="/schedule">
              <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-schedule-btn">
                View Schedule <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingLessons.length === 0 ? (
              <div className="empty-state py-8">
                <Calendar className="empty-state-icon" strokeWidth={1} />
                <p className="empty-state-title">No upcoming lessons</p>
                <p className="empty-state-description">Schedule some lessons to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.slice(0, 5).map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center gap-4 p-3 bg-[#F0F0EB] rounded-xl"
                    data-testid={`lesson-item-${lesson.id}`}
                  >
                    <div className="w-10 h-10 bg-[#2C3E50] rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate">{lesson.student_name}</p>
                      <p className="text-sm text-[#6B7280]">
                        {lesson.day_of_week} at {lesson.time} • {lesson.duration} min
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      lesson.days_from_now === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getDayLabel(lesson.days_from_now)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Fees */}
        <Card className="border-[#E5E5E0]" data-testid="pending-fees-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading text-xl">Pending Fees</CardTitle>
            <Link to="/fees">
              <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-fees-btn">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingFees.length === 0 ? (
              <div className="empty-state py-8">
                <CheckCircle2 className="empty-state-icon text-green-500" strokeWidth={1} />
                <p className="empty-state-title">All fees collected!</p>
                <p className="empty-state-description">No pending payments at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFees.slice(0, 5).map((fee) => (
                  <div 
                    key={fee.id} 
                    className="flex items-center gap-4 p-3 bg-[#F0F0EB] rounded-xl"
                    data-testid={`fee-item-${fee.id}`}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate">{fee.student_name}</p>
                      <p className="text-sm text-[#6B7280]">{fee.period} • Due: {fee.due_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#1A1A1A]">
                        ₹{fee.amount.toFixed(2)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="rounded-full text-xs"
                        onClick={() => handleMarkPaid(fee.id)}
                        data-testid={`mark-paid-btn-${fee.id}`}
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-[#E5E5E0]">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/students?action=add">
              <Button className="rounded-full bg-[#2C3E50]" data-testid="quick-add-student-btn">
                <Users className="w-4 h-4 mr-2" /> Add Student
              </Button>
            </Link>
            <Link to="/schedule?action=add">
              <Button variant="outline" className="rounded-full" data-testid="quick-add-lesson-btn">
                <Calendar className="w-4 h-4 mr-2" /> Schedule Lesson
              </Button>
            </Link>
            <Link to="/fees?action=add">
              <Button variant="outline" className="rounded-full" data-testid="quick-add-fee-btn">
                <DollarSign className="w-4 h-4 mr-2" /> Add Fee
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
