import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentsApi, lessonsApi, completedLessonsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Copy, 
  Check,
  Trash2,
  User,
  Clock,
  FileText,
  Share2,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const AttendancePage = () => {
  const [searchParams] = useSearchParams();
  
  const [students, setStudents] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get('student') || '');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    topics_covered: '',
    notes: ''
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchCompletedLessons();
    }
  }, [selectedStudent, selectedMonth]);

  const fetchStudents = async () => {
    try {
      const response = await studentsApi.getAll();
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedLessons = async () => {
    try {
      const response = await completedLessonsApi.getAll(selectedStudent, selectedMonth);
      setCompletedLessons(response.data);
    } catch (error) {
      toast.error('Failed to load completed lessons');
    }
  };

  const handleMarkComplete = async (e) => {
    e.preventDefault();
    try {
      await completedLessonsApi.create({
        ...formData,
        student_id: selectedStudent || formData.student_id,
        duration: parseInt(formData.duration),
      });
      toast.success('Lesson marked as completed!');
      setShowMarkDialog(false);
      resetForm();
      if (selectedStudent) {
        fetchCompletedLessons();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark lesson');
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Remove this completed lesson record?')) return;
    try {
      await completedLessonsApi.delete(lessonId);
      toast.success('Record removed');
      fetchCompletedLessons();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleGetSummary = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }
    try {
      const response = await completedLessonsApi.getMonthlySummary(selectedStudent, selectedMonth);
      setSummary(response.data);
      setShowSummaryDialog(true);
    } catch (error) {
      toast.error('Failed to generate summary');
    }
  };

  const handleCopyMessage = async () => {
    if (summary?.shareable_message) {
      try {
        await navigator.clipboard.writeText(summary.shareable_message);
        setCopied(true);
        toast.success('Copied! Ready to paste in WhatsApp');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (summary?.shareable_message) {
      const encoded = encodeURIComponent(summary.shareable_message);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      topics_covered: '',
      notes: ''
    });
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMM yyyy (EEEE)');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Attendance</h1>
          <p className="text-[#6B7280] mt-1">Track completed lessons & share reports with parents</p>
        </div>
        <Button 
          className="rounded-full bg-[#2C3E50]"
          onClick={() => { resetForm(); setShowMarkDialog(true); }}
          data-testid="mark-complete-btn"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Lesson Complete
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#E5E5E0]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger data-testid="student-filter-select">
                  <SelectValue placeholder="Choose a student" />
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
            <div className="w-full sm:w-48">
              <Label className="mb-2 block">Month</Label>
              <Select 
                value={selectedMonth} 
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger data-testid="month-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    MONTHS.map(month => (
                      <SelectItem key={`${year}-${month.value}`} value={`${year}-${month.value}`}>
                        {month.label} {year}
                      </SelectItem>
                    ))
                  )).flat()}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="rounded-full"
                onClick={handleGetSummary}
                disabled={!selectedStudent}
                data-testid="generate-summary-btn"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Lessons List */}
      <Card className="border-[#E5E5E0]">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            Completed Lessons
            {selectedStudent && (
              <span className="text-[#6B7280] font-normal text-base ml-2">
                - {getStudentName(selectedStudent)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedStudent ? (
            <div className="text-center py-12 text-[#6B7280]">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a student to view completed lessons</p>
            </div>
          ) : completedLessons.length === 0 ? (
            <div className="text-center py-12 text-[#6B7280]">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completed lessons for this month</p>
              <p className="text-sm mt-1">Mark a lesson as complete to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedLessons.map((lesson, index) => (
                <div 
                  key={lesson.id}
                  className="flex items-center justify-between p-4 bg-[#F0F0EB] rounded-xl"
                  data-testid={`completed-lesson-${lesson.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{formatDate(lesson.date)}</p>
                      <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {lesson.duration} min
                        </span>
                        {lesson.topics_covered && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {lesson.topics_covered}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(lesson.id)}
                    data-testid={`delete-completed-${lesson.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {/* Summary Stats */}
              <div className="mt-4 p-4 bg-[#2C3E50] rounded-xl text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/70 text-sm">Total This Month</p>
                    <p className="text-2xl font-semibold">{completedLessons.length} lessons</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-sm">Total Duration</p>
                    <p className="text-2xl font-semibold font-mono">
                      {completedLessons.reduce((sum, l) => sum + (l.duration || 60), 0)} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Complete Dialog */}
      <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Mark Lesson Complete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMarkComplete} className="space-y-4">
            {!selectedStudent && (
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select 
                  value={formData.student_id} 
                  onValueChange={(v) => setFormData({ ...formData, student_id: v })}
                >
                  <SelectTrigger data-testid="mark-student-select">
                    <SelectValue placeholder="Select student" />
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
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Lesson Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                data-testid="mark-date-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
              >
                <SelectTrigger data-testid="mark-duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Topics Covered</Label>
              <Input
                id="topics"
                value={formData.topics_covered}
                onChange={(e) => setFormData({ ...formData, topics_covered: e.target.value })}
                placeholder="e.g., Scales, Chopin Nocturne"
                data-testid="mark-topics-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any observations or feedback..."
                data-testid="mark-notes-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMarkDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={!selectedStudent && !formData.student_id}
                data-testid="submit-mark-btn"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary/Share Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Monthly Report</DialogTitle>
          </DialogHeader>
          
          {summary && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-4 bg-[#F0F0EB] rounded-xl">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="text-sm text-[#6B7280]">Student</p>
                    <p className="font-semibold">{summary.student_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6B7280]">Period</p>
                    <p className="font-semibold">{summary.period}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-[#6B7280]">Total Lessons</p>
                    <p className="text-2xl font-bold text-green-600">{summary.total_lessons}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6B7280]">Total Duration</p>
                    <p className="text-2xl font-bold font-mono">{summary.total_duration} min</p>
                  </div>
                </div>
              </div>

              {/* Dates List */}
              {summary.dates.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-[#6B7280] mb-2">Completed Dates:</p>
                  <div className="space-y-1">
                    {summary.dates.map((date, i) => (
                      <p key={i} className="text-sm">{i + 1}. {date}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Shareable Message Preview */}
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-[#6B7280] mb-2">Message Preview (WhatsApp Ready):</p>
                <pre className="text-xs whitespace-pre-wrap font-mono text-[#1A1A1A] max-h-32 overflow-y-auto">
                  {summary.shareable_message}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 rounded-full"
                  variant="outline"
                  onClick={handleCopyMessage}
                  data-testid="copy-message-btn"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy Message</>
                  )}
                </Button>
                <Button 
                  className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                  onClick={handleShareWhatsApp}
                  data-testid="share-whatsapp-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Share on WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendancePage;
