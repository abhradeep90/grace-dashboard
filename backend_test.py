import requests
import sys
import json
from datetime import datetime

class GraceMusicAPITester:
    def __init__(self, base_url="https://pianopulse.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_ids = {
            'students': [],
            'lessons': [],
            'fees': [],
            'notes': []
        }

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    self.log_result(name, success, details)
                    if method == 'POST' and 'id' in response_data:
                        return success, response_data
                    return success, response_data
                except:
                    self.log_result(name, success, details)
                    return success, {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                
                self.log_result(name, success, details)
                return success, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test registration with new user
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@gracemusic.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user,
            auth_required=False
        )
        
        # Test login with existing admin user
        admin_login = {
            "email": "admin@gracemusic.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"    ✅ Token obtained: {self.token[:20]}...")
            
            # Test /auth/me endpoint
            self.run_test(
                "Get Current User",
                "GET",
                "auth/me",
                200
            )
            return True
        else:
            print("    ❌ Failed to get authentication token")
            return False

    def test_students_endpoints(self):
        """Test student management endpoints"""
        print("\n👥 Testing Students...")
        
        # Test create student
        student_data = {
            "name": "Test Student",
            "email": "teststudent@example.com",
            "phone": "123-456-7890",
            "age": 25,
            "skill_level": "Beginner",
            "notes": "Test student for API testing"
        }
        
        success, response = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=student_data
        )
        
        if success and 'id' in response:
            student_id = response['id']
            self.created_ids['students'].append(student_id)
            
            # Test get all students
            self.run_test(
                "Get All Students",
                "GET",
                "students",
                200
            )
            
            # Test get specific student
            self.run_test(
                "Get Student by ID",
                "GET",
                f"students/{student_id}",
                200
            )
            
            # Test update student
            update_data = {**student_data, "name": "Updated Test Student"}
            self.run_test(
                "Update Student",
                "PUT",
                f"students/{student_id}",
                200,
                data=update_data
            )
            
            return student_id
        
        return None

    def test_lessons_endpoints(self, student_id):
        """Test lesson management endpoints"""
        print("\n📚 Testing Lessons...")
        
        if not student_id:
            self.log_result("Lessons Test", False, "No student ID available")
            return None
        
        # Test create lesson
        lesson_data = {
            "student_id": student_id,
            "title": "Piano Lesson",
            "description": "Basic piano lesson",
            "day_of_week": "Monday",
            "time": "10:00",
            "duration": 60,
            "topics_to_teach": "Scales and basic chords"
        }
        
        success, response = self.run_test(
            "Create Lesson",
            "POST",
            "lessons",
            200,
            data=lesson_data
        )
        
        if success and 'id' in response:
            lesson_id = response['id']
            self.created_ids['lessons'].append(lesson_id)
            
            # Test get all lessons
            self.run_test(
                "Get All Lessons",
                "GET",
                "lessons",
                200
            )
            
            # Test get lessons for specific student
            self.run_test(
                "Get Student Lessons",
                "GET",
                f"lessons?student_id={student_id}",
                200
            )
            
            # Test get specific lesson
            self.run_test(
                "Get Lesson by ID",
                "GET",
                f"lessons/{lesson_id}",
                200
            )
            
            # Test update lesson
            update_data = {**lesson_data, "title": "Updated Piano Lesson"}
            self.run_test(
                "Update Lesson",
                "PUT",
                f"lessons/{lesson_id}",
                200,
                data=update_data
            )
            
            return lesson_id
        
        return None

    def test_fees_endpoints(self, student_id):
        """Test fee management endpoints"""
        print("\n💰 Testing Fees...")
        
        if not student_id:
            self.log_result("Fees Test", False, "No student ID available")
            return None
        
        # Test create fee
        fee_data = {
            "student_id": student_id,
            "amount": 100.00,
            "due_date": "2025-02-01",
            "period": "January 2025",
            "status": "unpaid"
        }
        
        success, response = self.run_test(
            "Create Fee",
            "POST",
            "fees",
            200,
            data=fee_data
        )
        
        if success and 'id' in response:
            fee_id = response['id']
            self.created_ids['fees'].append(fee_id)
            
            # Test get all fees
            self.run_test(
                "Get All Fees",
                "GET",
                "fees",
                200
            )
            
            # Test get fees for specific student
            self.run_test(
                "Get Student Fees",
                "GET",
                f"fees?student_id={student_id}",
                200
            )
            
            # Test get fees by status
            self.run_test(
                "Get Unpaid Fees",
                "GET",
                "fees?status=unpaid",
                200
            )
            
            # Test get specific fee
            self.run_test(
                "Get Fee by ID",
                "GET",
                f"fees/{fee_id}",
                200
            )
            
            # Test mark fee as paid
            self.run_test(
                "Mark Fee as Paid",
                "PUT",
                f"fees/{fee_id}/mark-paid",
                200
            )
            
            # Test update fee
            update_data = {**fee_data, "amount": 120.00}
            self.run_test(
                "Update Fee",
                "PUT",
                f"fees/{fee_id}",
                200,
                data=update_data
            )
            
            return fee_id
        
        return None

    def test_notes_endpoints(self, student_id):
        """Test notes management endpoints"""
        print("\n📝 Testing Notes...")
        
        if not student_id:
            self.log_result("Notes Test", False, "No student ID available")
            return None
        
        # Test create note
        note_data = {
            "student_id": student_id,
            "content": "Student is progressing well with basic scales",
            "lesson_date": "2025-01-15"
        }
        
        success, response = self.run_test(
            "Create Note",
            "POST",
            "notes",
            200,
            data=note_data
        )
        
        if success and 'id' in response:
            note_id = response['id']
            self.created_ids['notes'].append(note_id)
            
            # Test get all notes
            self.run_test(
                "Get All Notes",
                "GET",
                "notes",
                200
            )
            
            # Test get notes for specific student
            self.run_test(
                "Get Student Notes",
                "GET",
                f"notes?student_id={student_id}",
                200
            )
            
            return note_id
        
        return None

    def test_completed_lessons_endpoints(self, student_id):
        """Test completed lessons (attendance) endpoints"""
        print("\n✅ Testing Completed Lessons (Attendance)...")
        
        if not student_id:
            self.log_result("Completed Lessons Test", False, "No student ID available")
            return None
        
        # Test create completed lesson
        completed_lesson_data = {
            "student_id": student_id,
            "date": "2025-12-15",
            "duration": 60,
            "topics_covered": "Scales, Chopin Nocturne",
            "notes": "Student showed great improvement"
        }
        
        success, response = self.run_test(
            "Create Completed Lesson",
            "POST",
            "completed-lessons",
            200,
            data=completed_lesson_data
        )
        
        if success and 'id' in response:
            completed_lesson_id = response['id']
            self.created_ids.setdefault('completed_lessons', []).append(completed_lesson_id)
            
            # Test get all completed lessons
            self.run_test(
                "Get All Completed Lessons",
                "GET",
                "completed-lessons",
                200
            )
            
            # Test get completed lessons for specific student
            self.run_test(
                "Get Student Completed Lessons",
                "GET",
                f"completed-lessons?student_id={student_id}",
                200
            )
            
            # Test get completed lessons for specific month
            self.run_test(
                "Get Completed Lessons by Month",
                "GET",
                f"completed-lessons?student_id={student_id}&month=2025-12",
                200
            )
            
            # Test monthly summary endpoint
            success_summary, summary_response = self.run_test(
                "Get Monthly Summary",
                "GET",
                f"completed-lessons/summary/{student_id}?month=2025-12",
                200
            )
            
            if success_summary:
                # Verify summary contains required fields
                required_fields = ['student_name', 'period', 'total_lessons', 'total_duration', 'dates', 'shareable_message']
                missing_fields = [field for field in required_fields if field not in summary_response]
                
                if missing_fields:
                    self.log_result(
                        "Summary Response Validation",
                        False,
                        f"Missing fields: {missing_fields}"
                    )
                else:
                    self.log_result(
                        "Summary Response Validation",
                        True,
                        "All required fields present"
                    )
                    
                    # Check if shareable message contains WhatsApp formatting
                    message = summary_response.get('shareable_message', '')
                    has_emojis = any(char in message for char in ['🎹', '📋', '👤', '📚', '⏱️', '📅'])
                    has_formatting = '*' in message and '_' in message
                    
                    self.log_result(
                        "WhatsApp Message Format",
                        has_emojis and has_formatting,
                        f"Emojis: {has_emojis}, Formatting: {has_formatting}"
                    )
            
            return completed_lesson_id
        
        return None

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n📊 Testing Dashboard...")
        
        # Test dashboard stats
        self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        # Test upcoming lessons
        self.run_test(
            "Get Upcoming Lessons",
            "GET",
            "dashboard/upcoming-lessons",
            200
        )
        
        # Test pending fees
        self.run_test(
            "Get Pending Fees",
            "GET",
            "dashboard/pending-fees",
            200
        )

    def test_expenses_endpoints(self):
        """Test expense management endpoints"""
        print("\n💸 Testing Expenses...")
        
        # Test create expense
        expense_data = {
            "name": "Test Studio Rent",
            "amount": 5000.00,
            "category": "rent",
            "is_recurring": True,
            "month": "January 2025"
        }
        
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if success and 'id' in response:
            expense_id = response['id']
            self.created_ids.setdefault('expenses', []).append(expense_id)
            
            # Test get all expenses
            self.run_test(
                "Get All Expenses",
                "GET",
                "expenses",
                200
            )
            
            # Test get expenses by category
            self.run_test(
                "Get Expenses by Category",
                "GET",
                "expenses?category=rent",
                200
            )
            
            # Test get expenses by month
            self.run_test(
                "Get Expenses by Month",
                "GET",
                "expenses?month=January 2025",
                200
            )
            
            # Test update expense
            update_data = {**expense_data, "amount": 5500.00}
            self.run_test(
                "Update Expense",
                "PUT",
                f"expenses/{expense_id}",
                200,
                data=update_data
            )
            
            return expense_id
        
        return None

    def test_finances_endpoints(self):
        """Test finance analytics endpoints"""
        print("\n📈 Testing Finance Analytics...")
        
        # Test finance summary
        self.run_test(
            "Get Finance Summary",
            "GET",
            "finances/summary",
            200
        )
        
        # Test monthly finances
        self.run_test(
            "Get Monthly Finances",
            "GET",
            "finances/monthly",
            200
        )
        
        # Test expense breakdown
        self.run_test(
            "Get Expense Breakdown",
            "GET",
            "finances/expense-breakdown",
            200
        )

    def test_reschedule_endpoints(self, lesson_id, student_id):
        """Test lesson reschedule functionality"""
        print("\n🔄 Testing Reschedule Functionality...")
        
        if not lesson_id or not student_id:
            self.log_result("Reschedule Test", False, "No lesson ID or student ID available")
            return None
        
        # Test reschedule lesson endpoint with query parameters
        reschedule_params = {
            "lesson_id": lesson_id,
            "original_date": "2025-01-20",  # Monday
            "new_date": "2025-01-22",       # Wednesday
            "new_time": "14:00",
            "reason": "Student requested time change"
        }
        
        # Build URL with query parameters
        query_string = "&".join([f"{k}={v}" for k, v in reschedule_params.items()])
        endpoint = f"lessons/reschedule?{query_string}"
        
        success, response = self.run_test(
            "Reschedule Lesson",
            "POST",
            endpoint,
            200,
            data=None  # No JSON body needed
        )
        
        if success:
            # Verify response contains expected fields
            expected_fields = ['message', 'original_date', 'new_date', 'new_time']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                self.log_result(
                    "Reschedule Response Validation",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_result(
                    "Reschedule Response Validation",
                    True,
                    "All required fields present"
                )
            
            # Test that schedule override was created
            success_override, override_response = self.run_test(
                "Get Schedule Overrides",
                "GET",
                f"schedule-overrides?lesson_id={lesson_id}",
                200
            )
            
            if success_override and isinstance(override_response, list) and len(override_response) > 0:
                self.log_result(
                    "Schedule Override Created",
                    True,
                    f"Found {len(override_response)} override(s)"
                )
                
                # Store override ID for cleanup
                override_id = override_response[0].get('id')
                if override_id:
                    self.created_ids.setdefault('schedule_overrides', []).append(override_id)
            else:
                self.log_result(
                    "Schedule Override Created",
                    False,
                    "No schedule override found after reschedule"
                )
            
            # Test that one-time lesson was created for the new date
            success_onetime, onetime_response = self.run_test(
                "Get One-Time Lessons After Reschedule",
                "GET",
                f"one-time-lessons?student_id={student_id}",
                200
            )
            
            if success_onetime and isinstance(onetime_response, list):
                rescheduled_lessons = [l for l in onetime_response if l.get('is_rescheduled') == True]
                if rescheduled_lessons:
                    self.log_result(
                        "Rescheduled One-Time Lesson Created",
                        True,
                        f"Found {len(rescheduled_lessons)} rescheduled lesson(s)"
                    )
                    
                    # Store lesson ID for cleanup
                    for lesson in rescheduled_lessons:
                        if lesson.get('id'):
                            self.created_ids.setdefault('one_time_lessons', []).append(lesson['id'])
                else:
                    self.log_result(
                        "Rescheduled One-Time Lesson Created",
                        False,
                        "No rescheduled one-time lesson found"
                    )
            else:
                self.log_result(
                    "Rescheduled One-Time Lesson Created",
                    False,
                    "Failed to get one-time lessons"
                )
        
        return success

    def test_one_time_lessons_endpoints(self, student_id):
        """Test one-time lesson (manual entry) functionality"""
        print("\n📝 Testing One-Time Lessons (Manual Entry)...")
        
        if not student_id:
            self.log_result("One-Time Lessons Test", False, "No student ID available")
            return None
        
        # Test create one-time lesson
        one_time_lesson_data = {
            "student_id": student_id,
            "title": "Special Piano Lesson",
            "date": "2025-01-25",  # Saturday
            "time": "16:00",
            "duration": 90,
            "topics_to_teach": "Advanced techniques and performance preparation",
            "notes": "One-time lesson for recital preparation",
            "is_rescheduled": False
        }
        
        success, response = self.run_test(
            "Create One-Time Lesson",
            "POST",
            "one-time-lessons",
            200,
            data=one_time_lesson_data
        )
        
        if success and 'id' in response:
            one_time_lesson_id = response['id']
            self.created_ids.setdefault('one_time_lessons', []).append(one_time_lesson_id)
            
            # Verify response contains expected fields
            expected_fields = ['id', 'student_id', 'title', 'date', 'time', 'duration', 'created_at']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                self.log_result(
                    "One-Time Lesson Response Validation",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_result(
                    "One-Time Lesson Response Validation",
                    True,
                    "All required fields present"
                )
            
            # Test get all one-time lessons
            self.run_test(
                "Get All One-Time Lessons",
                "GET",
                "one-time-lessons",
                200
            )
            
            # Test get one-time lessons for specific student
            success_student, student_response = self.run_test(
                "Get Student One-Time Lessons",
                "GET",
                f"one-time-lessons?student_id={student_id}",
                200
            )
            
            if success_student and isinstance(student_response, list):
                student_lessons = [l for l in student_response if l.get('student_id') == student_id]
                self.log_result(
                    "Student One-Time Lessons Filter",
                    len(student_lessons) > 0,
                    f"Found {len(student_lessons)} lesson(s) for student"
                )
            
            # Test get one-time lessons by month filter
            success_month, month_response = self.run_test(
                "Get One-Time Lessons by Month",
                "GET",
                "one-time-lessons?month=2025-01",
                200
            )
            
            if success_month and isinstance(month_response, list):
                january_lessons = [l for l in month_response if l.get('date', '').startswith('2025-01')]
                self.log_result(
                    "Month Filter for One-Time Lessons",
                    len(january_lessons) > 0,
                    f"Found {len(january_lessons)} lesson(s) in January 2025"
                )
            
            # Test update one-time lesson
            update_data = {**one_time_lesson_data, "title": "Updated Special Piano Lesson"}
            self.run_test(
                "Update One-Time Lesson",
                "PUT",
                f"one-time-lessons/{one_time_lesson_id}",
                200,
                data=update_data
            )
            
            return one_time_lesson_id
        
        return None

    def test_schedule_override_endpoints(self):
        """Test schedule override endpoints"""
        print("\n📅 Testing Schedule Override Endpoints...")
        
        # Test get all schedule overrides
        self.run_test(
            "Get All Schedule Overrides",
            "GET",
            "schedule-overrides",
            200
        )
        
        # Test get schedule overrides by date
        self.run_test(
            "Get Schedule Overrides by Date",
            "GET",
            "schedule-overrides?date=2025-01-20",
            200
        )

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete one-time lessons
        for one_time_lesson_id in self.created_ids.get('one_time_lessons', []):
            self.run_test(
                f"Delete One-Time Lesson {one_time_lesson_id}",
                "DELETE",
                f"one-time-lessons/{one_time_lesson_id}",
                200
            )
        
        # Delete schedule overrides
        for override_id in self.created_ids.get('schedule_overrides', []):
            self.run_test(
                f"Delete Schedule Override {override_id}",
                "DELETE",
                f"schedule-overrides/{override_id}",
                200
            )
        
        # Delete completed lessons
        for completed_lesson_id in self.created_ids.get('completed_lessons', []):
            self.run_test(
                f"Delete Completed Lesson {completed_lesson_id}",
                "DELETE",
                f"completed-lessons/{completed_lesson_id}",
                200
            )
        
        # Delete expenses
        for expense_id in self.created_ids.get('expenses', []):
            self.run_test(
                f"Delete Expense {expense_id}",
                "DELETE",
                f"expenses/{expense_id}",
                200
            )
        
        # Delete notes
        for note_id in self.created_ids['notes']:
            self.run_test(
                f"Delete Note {note_id}",
                "DELETE",
                f"notes/{note_id}",
                200
            )
        
        # Delete fees
        for fee_id in self.created_ids['fees']:
            self.run_test(
                f"Delete Fee {fee_id}",
                "DELETE",
                f"fees/{fee_id}",
                200
            )
        
        # Delete lessons
        for lesson_id in self.created_ids['lessons']:
            self.run_test(
                f"Delete Lesson {lesson_id}",
                "DELETE",
                f"lessons/{lesson_id}",
                200
            )
        
        # Delete students (this will cascade delete related records)
        for student_id in self.created_ids['students']:
            self.run_test(
                f"Delete Student {student_id}",
                "DELETE",
                f"students/{student_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Grace Music Academy API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_endpoints():
            print("\n❌ Authentication failed. Cannot proceed with other tests.")
            return False
        
        # Test all endpoints
        student_id = self.test_students_endpoints()
        lesson_id = self.test_lessons_endpoints(student_id)
        fee_id = self.test_fees_endpoints(student_id)
        note_id = self.test_notes_endpoints(student_id)
        completed_lesson_id = self.test_completed_lessons_endpoints(student_id)
        
        # Test dashboard
        self.test_dashboard_endpoints()
        
        # Test expenses and finances
        expense_id = self.test_expenses_endpoints()
        self.test_finances_endpoints()
        
        # Test NEW FEATURES - Reschedule and One-Time Lessons
        self.test_reschedule_endpoints(lesson_id, student_id)
        self.test_one_time_lessons_endpoints(student_id)
        self.test_schedule_override_endpoints()
        
        # Clean up test data
        self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        if self.tests_run > 0:
            print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        else:
            print("Success rate: 0.0%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = GraceMusicAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())