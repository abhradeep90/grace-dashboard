import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentsApi, lessonsApi, feesApi, notesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export const StudentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(searchParams.get('action') === 'add');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // Student detail data
  const [studentLessons, setStudentLessons] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    skill_level: 'Beginner',
    notes: ''
  });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const fetchStudentDetails = async (student) => {
    try {
      const [lessonsRes, feesRes, notesRes] = await Promise.all([
        lessonsApi.getAll(student.id),
        feesApi.getAll(student.id),
        notesApi.getAll(student.id),
      ]);
      setStudentLessons(lessonsRes.data);
      setStudentFees(feesRes.data);
      setStudentNotes(notesRes.data);
      setSelectedStudent(student);
      setShowDetailView(true);
    } catch (error) {
      toast.error('Failed to load student details');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
      };
      await studentsApi.create(data);
      toast.success('Student added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      toast.error('Failed to add student');
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
      };
      await studentsApi.update(selectedStudent.id, data);
      toast.success('Student updated successfully');
      setShowEditDialog(false);
      fetchStudents();
      if (showDetailView) {
        setSelectedStudent({ ...selectedStudent, ...data });
      }
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure? This will also delete all lessons, fees, and notes for this student.')) return;
    try {
      await studentsApi.delete(studentId);
      toast.success('Student deleted successfully');
      if (showDetailView) setShowDetailView(false);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await notesApi.create({
        student_id: selectedStudent.id,
        content: newNote,
        lesson_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Note added');
      setNewNote('');
      const notesRes = await notesApi.getAll(selectedStudent.id);
      setStudentNotes(notesRes.data);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesApi.delete(noteId);
      toast.success('Note deleted');
      setStudentNotes(studentNotes.filter(n => n.id !== noteId));
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      age: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      skill_level: 'Beginner',
      notes: ''
    });
  };

  const openEditDialog = (student) => {
    setFormData({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      age: student.age?.toString() || '',
      enrollment_date: student.enrollment_date || '',
      skill_level: student.skill_level || 'Beginner',
      notes: student.notes || ''
    });
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSkillBadgeClass = (level) => {
    switch (level) {
      case 'Beginner': return 'badge-beginner';
      case 'Intermediate': return 'badge-intermediate';
      case 'Advanced': return 'badge-advanced';
      default: return 'badge-beginner';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  // Student Detail View
  if (showDetailView && selectedStudent) {
    return (
      <div className="space-y-6" data-testid="student-detail-view">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowDetailView(false)}
            data-testid="back-to-students-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        {/* Student Info Card */}
        <Card className="border-[#E5E5E0]">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#2C3E50] rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-semibold text-[#1A1A1A]">
                    {selectedStudent.name}
                  </h1>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillBadgeClass(selectedStudent.skill_level)}`}>
                    {selectedStudent.skill_level}
                  </span>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-[#6B7280]">
                    {selectedStudent.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {selectedStudent.email}
                      </span>
                    )}
                    {selectedStudent.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {selectedStudent.phone}
                      </span>
                    )}
                    {selectedStudent.age && (
                      <span>Age: {selectedStudent.age}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => openEditDialog(selectedStudent)}
                  data-testid="edit-student-detail-btn"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteStudent(selectedStudent.id)}
                  data-testid="delete-student-detail-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="lessons" data-testid="tab-lessons">
              <Calendar className="w-4 h-4 mr-2" /> Lessons ({studentLessons.length})
            </TabsTrigger>
            <TabsTrigger value="fees" data-testid="tab-fees">
              <DollarSign className="w-4 h-4 mr-2" /> Fees ({studentFees.length})
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <FileText className="w-4 h-4 mr-2" /> Notes ({studentNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons">
            <Card className="border-[#E5E5E0]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Weekly Schedule</CardTitle>
                <Button 
                  size="sm" 
                  className="rounded-full bg-[#2C3E50]"
                  onClick={() => navigate(`/schedule?action=add&student=${selectedStudent.id}`)}
                  data-testid="add-lesson-from-detail-btn"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Lesson
                </Button>
              </CardHeader>
              <CardContent>
                {studentLessons.length === 0 ? (
                  <div className="empty-state py-8">
                    <Calendar className="empty-state-icon" strokeWidth={1} />
                    <p className="empty-state-title">No lessons scheduled</p>
                    <p className="empty-state-description">Add a lesson to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentLessons.map((lesson) => (
                      <div 
                        key={lesson.id}
                        className="flex items-center justify-between p-4 bg-[#F0F0EB] rounded-xl"
                        data-testid={`student-lesson-${lesson.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#2C3E50] rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{lesson.day_of_week} at {lesson.time}</p>
                            <p className="text-sm text-[#6B7280]">{lesson.title} • {lesson.duration} min</p>
                            {lesson.topics_to_teach && (
                              <p className="text-xs text-[#6B7280] mt-1">Topics: {lesson.topics_to_teach}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card className="border-[#E5E5E0]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Fee History</CardTitle>
                <Button 
                  size="sm" 
                  className="rounded-full bg-[#2C3E50]"
                  onClick={() => navigate(`/fees?action=add&student=${selectedStudent.id}`)}
                  data-testid="add-fee-from-detail-btn"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Fee
                </Button>
              </CardHeader>
              <CardContent>
                {studentFees.length === 0 ? (
                  <div className="empty-state py-8">
                    <DollarSign className="empty-state-icon" strokeWidth={1} />
                    <p className="empty-state-title">No fees recorded</p>
                    <p className="empty-state-description">Add a fee entry to track payments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentFees.map((fee) => (
                      <div 
                        key={fee.id}
                        className="flex items-center justify-between p-4 bg-[#F0F0EB] rounded-xl"
                        data-testid={`student-fee-${fee.id}`}
                      >
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{fee.period}</p>
                          <p className="text-sm text-[#6B7280]">Due: {fee.due_date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold">₹{fee.amount.toFixed(2)}</span>
                          <span className={fee.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
                            {fee.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card className="border-[#E5E5E0]">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Student Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note about progress, things to work on, etc..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                    data-testid="new-note-input"
                  />
                  <Button 
                    onClick={handleAddNote}
                    className="rounded-full bg-[#2C3E50]"
                    data-testid="add-note-btn"
                  >
                    Add
                  </Button>
                </div>

                {/* Notes List */}
                {studentNotes.length === 0 ? (
                  <div className="empty-state py-8">
                    <FileText className="empty-state-icon" strokeWidth={1} />
                    <p className="empty-state-title">No notes yet</p>
                    <p className="empty-state-description">Add notes to track student progress</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentNotes.map((note) => (
                      <div 
                        key={note.id}
                        className="p-4 bg-[#F0F0EB] rounded-xl"
                        data-testid={`note-${note.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-[#1A1A1A] whitespace-pre-wrap">{note.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteNote(note.id)}
                            data-testid={`delete-note-${note.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-2">
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Students List View
  return (
    <div className="space-y-6" data-testid="students-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Students</h1>
          <p className="text-[#6B7280] mt-1">Manage your academy students</p>
        </div>
        <Button 
          className="rounded-full bg-[#2C3E50]"
          onClick={() => { resetForm(); setShowAddDialog(true); }}
          data-testid="add-student-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-[#E5E5E0]"
          data-testid="search-students-input"
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card className="border-[#E5E5E0]">
          <CardContent>
            <div className="empty-state py-12">
              <User className="empty-state-icon" strokeWidth={1} />
              <p className="empty-state-title">
                {searchQuery ? 'No students found' : 'No students yet'}
              </p>
              <p className="empty-state-description">
                {searchQuery ? 'Try a different search term' : 'Add your first student to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="border-[#E5E5E0] card-hover cursor-pointer"
              onClick={() => fetchStudentDetails(student)}
              data-testid={`student-card-${student.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2C3E50] rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#1A1A1A] truncate">{student.name}</h3>
                    {student.email && (
                      <p className="text-sm text-[#6B7280] truncate">{student.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSkillBadgeClass(student.skill_level)}`}>
                        {student.skill_level}
                      </span>
                      {student.age && (
                        <span className="text-xs text-[#6B7280]">Age {student.age}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#E5E5E0]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(student); }}
                    data-testid={`edit-student-${student.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}
                    data-testid={`delete-student-${student.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="student-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="student-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="student-phone-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  data-testid="student-age-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill_level">Skill Level</Label>
                <Select 
                  value={formData.skill_level} 
                  onValueChange={(v) => setFormData({ ...formData, skill_level: v })}
                >
                  <SelectTrigger data-testid="student-skill-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment_date">Enrollment Date</Label>
              <Input
                id="enrollment_date"
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                data-testid="student-enrollment-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any initial notes about the student..."
                data-testid="student-notes-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="save-student-btn">
                Add Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="edit-student-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="edit-student-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="edit-student-phone-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  data-testid="edit-student-age-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-skill_level">Skill Level</Label>
                <Select 
                  value={formData.skill_level} 
                  onValueChange={(v) => setFormData({ ...formData, skill_level: v })}
                >
                  <SelectTrigger data-testid="edit-student-skill-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="edit-student-notes-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2C3E50]" data-testid="update-student-btn">
                Update Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
