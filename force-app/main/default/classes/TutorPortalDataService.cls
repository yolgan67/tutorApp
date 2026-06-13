public without sharing class TutorPortalDataService {

    // Helper to validate teacher token
    private static void validateTeacherToken(String token) {
        if (String.isBlank(token)) {
            throw new AuraHandledException('Unauthorized: Token is missing.');
        }
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        if (config == null || config.Teacher_Session_Token__c != token) {
            throw new AuraHandledException('Unauthorized: Invalid session.');
        }
        if (config.Teacher_Token_Expiration__c < Datetime.now()) {
            throw new AuraHandledException('Unauthorized: Session expired.');
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Student__c> getAllStudents(String token) {
        validateTeacherToken(token);
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Username__c, Balance__c, Total_Paid_Amount__c, Total_Lesson_Fee__c,
                   Grade__c, School__c
            FROM Student__c
            ORDER BY First_Name__c ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getStudentDetails(String token, Id studentId) {
        validateTeacherToken(token);
        
        Map<String, Object> result = new Map<String, Object>();
        
        // Get Student Details with Parent Contact Details
        Student__c student = [
            SELECT Id, Name, First_Name__c, Last_Name__c, Balance__c, Total_Lesson_Fee__c, Total_Paid_Amount__c,
                   Grade__c, School__c, Registration_Date__c,
                   Parent__c, Parent__r.Name, Parent__r.Phone__c, Parent__r.Email__c
            FROM Student__c
            WHERE Id = :studentId
            LIMIT 1
        ];
        result.put('student', student);
        
        // Get Past Lessons
        List<Lesson__c> pastLessons = [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c
            FROM Lesson__c
            WHERE Student__c = :studentId AND Date_Time__c < :Datetime.now()
            ORDER BY Date_Time__c DESC
        ];
        result.put('pastLessons', pastLessons);
        
        // Get Future Lessons
        List<Lesson__c> futureLessons = [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c
            FROM Lesson__c
            WHERE Student__c = :studentId AND Date_Time__c >= :Datetime.now()
            ORDER BY Date_Time__c ASC
        ];
        result.put('futureLessons', futureLessons);
        
        // Get Payments
        List<Payment__c> payments = [
            SELECT Id, Amount__c, Payment_Date__c, Payment_Method__c, Status__c
            FROM Payment__c
            WHERE Student__c = :studentId
            ORDER BY Payment_Date__c DESC
        ];
        result.put('payments', payments);
        
        // Get Homework with complete student submission fields
        List<Homework__c> homeworks = [
            SELECT Id, Title__c, Description__c, Due_Date__c, Status__c, Grade__c, Lesson__r.Branch__c,
                   Completed_Questions__c, Correct_Answers__c, Wrong_Answers__c, Student_Comment__c, Teacher_Comment__c
            FROM Homework__c
            WHERE Student__c = :studentId
            ORDER BY Due_Date__c ASC
        ];
        result.put('homeworks', homeworks);

        // Get Progress Exams
        List<Progress_Exam__c> exams = [
            SELECT Id, Exam_Title__c, Date__c, Total_Questions__c, Total_Correct__c, Total_Wrong__c,
                   Math_Correct__c, Math_Wrong__c, Total_Net__c, Math_Net__c, Score__c, Teacher_Feedback__c
            FROM Progress_Exam__c
            WHERE Student__c = :studentId
            ORDER BY Date__c DESC
        ];
        result.put('exams', exams);
        
        return result;
    }

    @AuraEnabled
    public static List<Lesson__c> getWeeklyLessons(String token, Datetime startDate, Datetime endDate) {
        validateTeacherToken(token);
        
        // Auto-complete past lessons
        List<Lesson__c> pastLessonsToComplete = [
            SELECT Id, Status__c 
            FROM Lesson__c 
            WHERE Date_Time__c < :Datetime.now() 
              AND Status__c = 'Scheduled'
        ];
        if (!pastLessonsToComplete.isEmpty()) {
            for (Lesson__c l : pastLessonsToComplete) {
                l.Status__c = 'Completed';
            }
            update pastLessonsToComplete;
        }

        return [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c,
                   Student__c, Student__r.First_Name__c, Student__r.Last_Name__c, Student__r.Name
            FROM Lesson__c
            WHERE Date_Time__c >= :startDate AND Date_Time__c <= :endDate
            ORDER BY Date_Time__c ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getStudentDropdownOptions(String token) {
        validateTeacherToken(token);
        List<Map<String, Object>> options = new List<Map<String, Object>>();
        for (Student__c s : [SELECT Id, First_Name__c, Last_Name__c, Default_Hourly_Rate__c FROM Student__c ORDER BY First_Name__c ASC]) {
            Map<String, Object> opt = new Map<String, Object>();
            opt.put('label', s.First_Name__c + ' ' + s.Last_Name__c);
            opt.put('value', s.Id);
            opt.put('defaultRate', s.Default_Hourly_Rate__c != null ? s.Default_Hourly_Rate__c : 500);
            options.add(opt);
        }
        return options;
    }

    @AuraEnabled
    public static Lesson__c upsertLesson(String token, Lesson__c lessonData) {
        validateTeacherToken(token);
        upsert lessonData;
        return lessonData;
    }

    @AuraEnabled
    public static void updateLessonStatus(String token, Id lessonId, String newStatus) {
        validateTeacherToken(token);
        Lesson__c lessonToUpdate = new Lesson__c(Id = lessonId, Status__c = newStatus);
        update lessonToUpdate;
    }

    @AuraEnabled
    public static Homework__c addHomework(String token, Homework__c homeworkData) {
        validateTeacherToken(token);
        insert homeworkData;
        return homeworkData;
    }

    @AuraEnabled
    public static Payment__c addPayment(String token, Payment__c paymentData) {
        validateTeacherToken(token);
        insert paymentData;
        return paymentData;
    }

    // Homework Evaluation (Grading) by Teacher
    @AuraEnabled
    public static void gradeHomework(String token, Id homeworkId, Decimal grade, String comment, String status) {
        validateTeacherToken(token);
        List<Homework__c> hws = [
            SELECT Id, Grade__c, Teacher_Comment__c, Status__c 
            FROM Homework__c 
            WHERE Id = :homeworkId 
            LIMIT 1
        ];
        if (hws.isEmpty()) {
            throw new AuraHandledException('Ödev bulunamadı.');
        }
        Homework__c hw = hws[0];
        hw.Grade__c = grade;
        hw.Teacher_Comment__c = comment;
        hw.Status__c = status;
        update hw;
    }

    // On-Demand generation of weekly lessons from recurring schedules
    @AuraEnabled
    public static Integer generateWeeklyLessonsFromSchedule(String token) {
        validateTeacherToken(token);
        
        // Calculate next Monday date reliably
        Date today = Date.today();
        Date knownMonday = Date.newInstance(1900, 1, 1);
        Integer daysBetween = knownMonday.daysBetween(today);
        Integer dayOfWeek = Math.mod(daysBetween, 7); // 0 = Monday, ..., 6 = Sunday
        Integer daysUntilNextMonday = 7 - dayOfWeek;
        Date nextMonday = today.addDays(daysUntilNextMonday);
        
        return WeeklyLessonGenerator.generateLessonsForWeek(nextMonday);
    }
}