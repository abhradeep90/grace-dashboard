import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { lessonsApi, studentsApi, scheduleApi, completedLessonsApi, oneTimeLessonsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { 
  Plus, 
  Edit2, 
  Trash2,
  Clock,
  User,
  Music,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  CalendarPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_MAP = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
const TIME_SLOTS = [];
for (let h = 8; h <= 20; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export const SchedulePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [oneTimeLessons, setOneTimeLessons] = useState([]);
  const [scheduleOverrides, setScheduleOverrides] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(searchParams.get('action') === 'add');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'calendar'
  const [completeDate, setCompleteDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedLessons, setCompletedLessons] = useState([]);
  
  // Reschedule form
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });
  
  // Manual entry form
  const [manualEntryData, setManualEntryData] = useState({
    student_id: '',
    title: 'Piano Lesson',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 60,
    topics_to_teach: ''
  });
  
  const [formData, setFormData] = useState({
    student_id: searchParams.get('student') || '',
    title: 'Piano Lesson',
    description: '',
    day_of_week: 'Monday',
    time: '10:00',
    duration: 60,
    topics_to_teach: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      // Get month string for completed lessons
      const monthStr = format(currentMonth, 'yyyy-MM');
      const [lessonsRes, studentsRes, completedRes, oneTimeRes, overridesRes] = await Promise.all([
        lessonsApi.getAll(),
        studentsApi.getAll(),
        completedLessonsApi.getAll(null, monthStr),
        oneTimeLessonsApi.getAll(null, monthStr),
        scheduleApi.getOverrides(),
      ]);
      setLessons(lessonsRes.data);
      setStudents(studentsRes.data);
      setCompletedLessons(completedRes.data);
      setOneTimeLessons(oneTimeRes.data);
      setScheduleOverrides(overridesRes.data);
    } catch (error) {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  // Check if a recurring lesson has been rescheduled for a specific date
  const isLessonRescheduled = (lessonId, date) => {
    return scheduleOverrides.some(
      o => o.lesson_id === lessonId && o.original_date === date
    );
  };

  // Generate all lesson occurrences for a given month based on weekly schedule
  const generateMonthlyLessons = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    
    const monthlyLessons = [];
    
    // Add recurring lessons (excluding rescheduled dates)
    lessons.forEach(lesson => {
      const lessonDayNum = DAY_MAP[lesson.day_of_week];
      
      allDays.forEach(day => {
        if (day.getDay() === lessonDayNum) {
          const dateStr = format(day, 'yyyy-MM-dd');
          // Skip if this occurrence has been rescheduled
          if (!isLessonRescheduled(lesson.id, dateStr)) {
            monthlyLessons.push({
              ...lesson,
              scheduledDate: dateStr,
              displayDate: format(day, 'dd MMM'),
              dayName: format(day, 'EEEE'),
              isRecurring: true,
              isOneTime: false,
            });
          }
        }
      });
    });
    
    // Add one-time lessons (manual entries and rescheduled)
    oneTimeLessons.forEach(lesson => {
      const lessonDate = new Date(lesson.date);
      monthlyLessons.push({
        ...lesson,
        scheduledDate: lesson.date,
        displayDate: format(lessonDate, 'dd MMM'),
        dayName: format(lessonDate, 'EEEE'),
        isRecurring: false,
        isOneTime: true,
      });
    });
    
    // Sort by date and time
    monthlyLessons.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.time.localeCompare(b.time);
    });
    
    return monthlyLessons;
  };

  // Check if a lesson has been completed for a specific date
  const isLessonCompletedForDate = (lesson, date) => {
    return completedLessons.some(
      c => c.lesson_id === lesson.id && c.date === date
    );
  };

  // Check if THIS specific lesson is completed for today
  const isLessonCompletedToday = (lesson) => {
    const today = new Date().toISOString().split('T')[0];
    return completedLessons.some(
      c => c.lesson_id === lesson.id && c.date === today
    );
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      await lessonsApi.create({
        ...formData,
        duration: parseInt(formData.duration),
      });
      toast.success('Lesson scheduled successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to schedule lesson');
    }
  };

  const handleEditLesson = async (e) => {
    e.preventDefault();
    try {
      await lessonsApi.update(selectedLesson.id, {
        ...formData,
        duration: parseInt(formData.duration),
      });
      toast.success('Lesson updated successfully');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await lessonsApi.delete(lessonId);
      toast.success('Lesson deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const openCompleteDialog = (lesson) => {
    setSelectedLesson(lesson);
    setCompleteDate(new Date().toISOString().split('T')[0]);
    setShowCompleteDialog(true);
  };

  const handleMarkComplete = async () => {
    // Check if already completed for this date
    if (isLessonCompletedForDate(selectedLesson, completeDate)) {
      toast.error('This lesson is already marked complete for this date');
      setShowCompleteDialog(false);
      return;
    }
    
    try {
      await completedLessonsApi.create({
        student_id: selectedLesson.student_id,
        lesson_id: selectedLesson.id,
        date: completeDate,
        duration: selectedLesson.duration,
        topics_covered: selectedLesson.topics_to_teach || selectedLesson.title,
        notes: ''
      });
      toast.success('Lesson marked as completed!');
      setShowCompleteDialog(false);
      fetchData(); // Refresh to update the UI
    } catch (error) {
      toast.error('Failed to mark lesson complete');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      title: 'Piano Lesson',
      description: '',
      day_of_week: 'Monday',
      time: '10:00',
      duration: 60,
      topics_to_teach: ''
    });
  };

  const openEditDialog = (lesson) => {
    setFormData({
      student_id: lesson.student_id,
      title: lesson.title,
      description: lesson.description || '',
      day_of_week: lesson.day_of_week,
      time: lesson.time,
      duration: lesson.duration,
      topics_to_teach: lesson.topics_to_teach || ''
    });
    setSelectedLesson(lesson);
    setShowEditDialog(true);
  };

  // Open reschedule dialog for a lesson
  const openRescheduleDialog = (lesson, date) => {
    setSelectedLesson({ ...lesson, scheduledDate: date });
    setRescheduleData({
      newDate: '',
      newTime: lesson.time,
      reason: ''
    });
    setShowRescheduleDialog(true);
  };

  // Handle reschedule submission
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedLesson || !rescheduleData.newDate || !rescheduleData.newTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await scheduleApi.reschedule(
        selectedLesson.id,
        selectedLesson.scheduledDate,
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.reason
      );
      toast.success('Lesson rescheduled successfully!');
      setShowRescheduleDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reschedule lesson');
    }
  };

  // Open manual entry dialog
  const openManualEntryDialog = () => {
    setManualEntryData({
      student_id: '',
      title: 'Piano Lesson',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: 60,
      topics_to_teach: ''
    });
    setShowManualEntryDialog(true);
  };

  // Handle manual entry submission
  const handleManualEntry = async (e) => {
    e.preventDefault();
    if (!manualEntryData.student_id || !manualEntryData.date) {
      toast.error('Please select a student and date');
      return;
    }

    try {
      await oneTimeLessonsApi.create({
        student_id: manualEntryData.student_id,
        title: manualEntryData.title,
        date: manualEntryData.date,
        time: manualEntryData.time,
        duration: manualEntryData.duration,
        topics_to_teach: manualEntryData.topics_to_teach,
        is_rescheduled: false
      });
      toast.success('One-time lesson added successfully!');
      setShowManualEntryDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add lesson');
    }
  };

  // Group lessons by day for week view
  const lessonsByDay = DAYS.reduce((acc, day) => {
    acc[day] = lessons
      .filter(l => l.day_of_week === day)
      .sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="schedule-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Schedule</h1>
          <p className="text-[#6B7280] mt-1">Weekly lesson schedule</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#F0F0EB] rounded-full p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full ${viewMode === 'week' ? 'bg-[#2C3E50]' : ''}`}
              onClick={() => setViewMode('week')}
              data-testid="view-week-btn"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full ${viewMode === 'calendar' ? 'bg-[#2C3E50]' : ''}`}
              onClick={() => setViewMode('calendar')}
              data-testid="view-calendar-btn"
            >
              Calendar
            </Button>
          </div>
          <Button 
            className="rounded-full bg-[#2C3E50]"
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            data-testid="add-lesson-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
          <Button 
            className="rounded-full bg-green-600 hover:bg-green-700"
            onClick={openManualEntryDialog}
            data-testid="manual-entry-btn"
          >
            <CalendarPlus className="w-4 h-4 mr-2" /> One-Time Lesson
          </Button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {DAYS.map((day) => (
            <Card key={day} className="border-[#E5E5E0]" data-testid={`day-column-${day.toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-center text-[#6B7280]">
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {lessonsByDay[day].length === 0 ? (
                  <p className="text-xs text-center text-[#6B7280] py-4">No lessons</p>
                ) : (
                  lessonsByDay[day].map((lesson) => {
                    const completedToday = isLessonCompletedToday(lesson);
                    return (
                    <div
                      key={lesson.id}
                      className={`p-3 rounded-lg group relative ${completedToday ? 'bg-green-700' : 'bg-[#2C3E50]'} text-white`}
                      data-testid={`lesson-card-${lesson.id}`}
                    >
                      <div className="flex items-center gap-1 text-xs text-white/70 mb-1">
                        <Clock className="w-3 h-3" />
                        {lesson.time} • {lesson.duration}min
                      </div>
                      <p className="font-medium text-sm truncate">{getStudentName(lesson.student_id)}</p>
                      <p className="text-xs text-white/70 truncate">{lesson.title}</p>
                      
                      {/* Show Completed badge or Mark Complete button */}
                      {completedToday ? (
                        <div className="w-full mt-2 h-7 bg-white/20 rounded flex items-center justify-center text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed Today ✓
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full mt-2 h-7 bg-green-600 hover:bg-green-700 text-xs"
                          onClick={() => openCompleteDialog(lesson)}
                          data-testid={`complete-lesson-${lesson.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
                        </Button>
                      )}
                      
                      {/* Edit/Delete buttons on hover */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-white hover:bg-white/20"
                          onClick={() => openEditDialog(lesson)}
                          data-testid={`edit-lesson-${lesson.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-white hover:bg-red-500/50"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          data-testid={`delete-lesson-${lesson.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )})
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar View - Monthly Schedule */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="prev-month-btn"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <h2 className="font-heading text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="next-month-btn"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Monthly Lessons List */}
          <Card className="border-[#E5E5E0]">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                All Lessons in {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const monthlyLessons = generateMonthlyLessons();
                
                if (monthlyLessons.length === 0) {
                  return (
                    <div className="empty-state py-8">
                      <CalendarDays className="empty-state-icon" strokeWidth={1} />
                      <p className="empty-state-title">No lessons scheduled</p>
                      <p className="empty-state-description">Add a weekly schedule to see lessons here</p>
                    </div>
                  );
                }
                
                // Group by date for better display
                const groupedByDate = {};
                monthlyLessons.forEach(lesson => {
                  if (!groupedByDate[lesson.scheduledDate]) {
                    groupedByDate[lesson.scheduledDate] = [];
                  }
                  groupedByDate[lesson.scheduledDate].push(lesson);
                });
                
                return (
                  <div className="space-y-4">
                    {Object.entries(groupedByDate).map(([date, dateLessons]) => (
                      <div key={date} className="border-b border-[#E5E5E0] pb-4 last:border-0">
                        <h3 className="text-sm font-semibold text-[#6B7280] mb-2">
                          {format(new Date(date), 'EEEE, dd MMMM yyyy')}
                        </h3>
                        <div className="space-y-2">
                          {dateLessons.map((lesson, idx) => {
                            const isCompleted = isLessonCompletedForDate(lesson, date);
                            return (
                              <div 
                                key={`${lesson.id}-${date}-${idx}`}
                                className={`flex items-center justify-between p-3 rounded-xl ${isCompleted ? 'bg-green-100 border border-green-300' : 'bg-[#F0F0EB]'}`}
                                data-testid={`monthly-lesson-${lesson.id}-${date}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-600' : 'bg-[#2C3E50]'}`}>
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                      <Music className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-[#1A1A1A]">{getStudentName(lesson.student_id)}</p>
                                      {lesson.isOneTime && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                          {lesson.is_rescheduled ? 'Rescheduled' : 'One-time'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-[#6B7280]">{lesson.time} • {lesson.duration} min</p>
                                    {isCompleted && (
                                      <p className="text-xs text-green-600 font-medium">✓ Completed</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {!isCompleted && lesson.isRecurring && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white"
                                      onClick={() => openRescheduleDialog(lesson, date)}
                                      data-testid={`reschedule-${lesson.id}-${date}`}
                                    >
                                      <CalendarClock className="w-4 h-4 mr-1" /> Reschedule
                                    </Button>
                                  )}
                                  {!isCompleted && (
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setSelectedLesson(lesson);
                                        setCompleteDate(date);
                                        setShowCompleteDialog(true);
                                      }}
                                      data-testid={`complete-${lesson.id}-${date}`}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Mark Lesson Complete</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F0F0EB] rounded-xl">
                <p className="font-medium">{getStudentName(selectedLesson.student_id)}</p>
                <p className="text-sm text-[#6B7280]">
                  {selectedLesson.day_of_week} at {selectedLesson.time} • {selectedLesson.duration} min
                </p>
                {selectedLesson.topics_to_teach && (
                  <p className="text-xs text-[#6B7280] mt-1">Topics: {selectedLesson.topics_to_teach}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="complete-date">Lesson Date</Label>
                <Input
                  id="complete-date"
                  type="date"
                  value={completeDate}
                  onChange={(e) => setCompleteDate(e.target.value)}
                  data-testid="complete-date-input"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleMarkComplete}
                  data-testid="confirm-complete-btn"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Schedule New Lesson</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLesson} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(v) => setFormData({ ...formData, student_id: v })}
              >
                <SelectTrigger data-testid="lesson-student-select">
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
            
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="lesson-title-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <Select 
                  value={formData.day_of_week} 
                  onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}
                >
                  <SelectTrigger data-testid="lesson-day-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(v) => setFormData({ ...formData, time: v })}
                >
                  <SelectTrigger data-testid="lesson-time-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
              >
                <SelectTrigger data-testid="lesson-duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Topics to Teach</Label>
              <Textarea
                id="topics"
                value={formData.topics_to_teach}
                onChange={(e) => setFormData({ ...formData, topics_to_teach: e.target.value })}
                placeholder="e.g., Scales, Chopin Nocturne Op.9 No.2..."
                data-testid="lesson-topics-input"
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
                data-testid="save-lesson-btn"
              >
                Schedule Lesson
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Lesson Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <CalendarClock className="w-5 h-5" /> Reschedule Lesson
            </DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="p-4 bg-[#F0F0EB] rounded-xl">
                <p className="font-medium">{getStudentName(selectedLesson.student_id)}</p>
                <p className="text-sm text-[#6B7280]">
                  Original: {selectedLesson.scheduledDate || selectedLesson.day_of_week} at {selectedLesson.time}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date *</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  required
                  data-testid="reschedule-date-input"
                />
              </div>

              <div className="space-y-2">
                <Label>New Time *</Label>
                <Select
                  value={rescheduleData.newTime}
                  onValueChange={(v) => setRescheduleData({ ...rescheduleData, newTime: v })}
                >
                  <SelectTrigger data-testid="reschedule-time-select">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-reason">Reason (optional)</Label>
                <Textarea
                  id="reschedule-reason"
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                  placeholder="e.g., Student requested change, holiday..."
                  data-testid="reschedule-reason-input"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2C3E50]"
                  disabled={!rescheduleData.newDate || !rescheduleData.newTime}
                  data-testid="confirm-reschedule-btn"
                >
                  <CalendarClock className="w-4 h-4 mr-2" /> Reschedule
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntryDialog} onOpenChange={setShowManualEntryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" /> Add One-Time Lesson
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualEntry} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select
                value={manualEntryData.student_id}
                onValueChange={(v) => setManualEntryData({ ...manualEntryData, student_id: v })}
              >
                <SelectTrigger data-testid="manual-student-select">
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

            <div className="space-y-2">
              <Label htmlFor="manual-date">Date *</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualEntryData.date}
                onChange={(e) => setManualEntryData({ ...manualEntryData, date: e.target.value })}
                required
                data-testid="manual-date-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time *</Label>
                <Select
                  value={manualEntryData.time}
                  onValueChange={(v) => setManualEntryData({ ...manualEntryData, time: v })}
                >
                  <SelectTrigger data-testid="manual-time-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={manualEntryData.duration.toString()}
                  onValueChange={(v) => setManualEntryData({ ...manualEntryData, duration: parseInt(v) })}
                >
                  <SelectTrigger data-testid="manual-duration-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-topics">Topics to Teach</Label>
              <Textarea
                id="manual-topics"
                value={manualEntryData.topics_to_teach}
                onChange={(e) => setManualEntryData({ ...manualEntryData, topics_to_teach: e.target.value })}
                placeholder="e.g., Make-up class for missed session..."
                data-testid="manual-topics-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowManualEntryDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2C3E50]"
                disabled={!manualEntryData.student_id || !manualEntryData.date}
                data-testid="confirm-manual-btn"
              >
                <CalendarPlus className="w-4 h-4 mr-2" /> Add Lesson
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Lesson</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditLesson} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(v) => setFormData({ ...formData, student_id: v })}
              >
                <SelectTrigger data-testid="edit-lesson-student-select">
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
            
            <div className="space-y-2">
              <Label htmlFor="edit-title">Lesson Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="edit-lesson-title-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <Select 
                  value={formData.day_of_week} 
                  onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}
                >
                  <SelectTrigger data-testid="edit-lesson-day-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(v) => setFormData({ ...formData, time: v })}
                >
                  <SelectTrigger data-testid="edit-lesson-time-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
              >
                <SelectTrigger data-testid="edit-lesson-duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-topics">Topics to Teach</Label>
              <Textarea
                id="edit-topics"
                value={formData.topics_to_teach}
                onChange={(e) => setFormData({ ...formData, topics_to_teach: e.target.value })}
                data-testid="edit-lesson-topics-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="update-lesson-btn">
                Update Lesson
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;
