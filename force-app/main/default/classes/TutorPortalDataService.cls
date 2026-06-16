public without sharing class TutorPortalDataService {

    private static void validateTeacherToken(String token) {
        if (String.isBlank(token)) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        if (config == null || config.Teacher_Session_Token__c != token) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        if (config.Teacher_Token_Expiration__c < Datetime.now()) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Student__c> getAllStudents(String token) {
        validateTeacherToken(token);
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Username__c, Balance__c,
                   Total_Paid_Amount__c, Total_Lesson_Fee__c, Grade__c, School__c,
                   Student_Type__c, Target_Exam_Date__c
            FROM Student__c
            ORDER BY First_Name__c ASC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Lesson__c> getTodayLessons(String token) {
        validateTeacherToken(token);
        Datetime startOfDay = Datetime.newInstance(Date.today(), Time.newInstance(0, 0, 0, 0));
        Datetime endOfDay   = Datetime.newInstance(Date.today(), Time.newInstance(23, 59, 59, 0));
        return [
            SELECT Id, Name, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c,
                   Student__c, Student__r.First_Name__c, Student__r.Last_Name__c, Lesson_Notes__c
            FROM Lesson__c
            WHERE Date_Time__c >= :startOfDay AND Date_Time__c <= :endOfDay
            ORDER BY Date_Time__c ASC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getStudentDetails(String token, Id studentId) {
        validateTeacherToken(token);
        Map<String, Object> result = new Map<String, Object>();

        Student__c student = [
            SELECT Id, Name, First_Name__c, Last_Name__c, Balance__c, Total_Lesson_Fee__c, Total_Paid_Amount__c,
                   Grade__c, School__c, Registration_Date__c, Student_Type__c, Target_Exam_Date__c,
                   Parent__c, Parent__r.Name, Parent__r.Phone__c, Parent__r.Email__c
            FROM Student__c
            WHERE Id = :studentId
            LIMIT 1
        ];
        result.put('student', student);

        List<Lesson__c> pastLessons = [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c, Lesson_Notes__c
            FROM Lesson__c
            WHERE Student__c = :studentId AND Date_Time__c < :Datetime.now()
            ORDER BY Date_Time__c DESC
        ];
        result.put('pastLessons', pastLessons);

        List<Lesson__c> futureLessons = [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c, Lesson_Notes__c
            FROM Lesson__c
            WHERE Student__c = :studentId AND Date_Time__c >= :Datetime.now()
            ORDER BY Date_Time__c ASC
        ];
        result.put('futureLessons', futureLessons);

        List<Payment__c> payments = [
            SELECT Id, Amount__c, Payment_Date__c, Payment_Method__c, Status__c
            FROM Payment__c
            WHERE Student__c = :studentId
            ORDER BY Payment_Date__c DESC
        ];
        result.put('payments', payments);

        List<Homework__c> homeworks = [
            SELECT Id, Title__c, Description__c, Due_Date__c, Status__c, Grade__c, Lesson__r.Branch__c,
                   Completed_Questions__c, Correct_Answers__c, Wrong_Answers__c, Student_Comment__c, Teacher_Comment__c
            FROM Homework__c
            WHERE Student__c = :studentId
            ORDER BY Due_Date__c ASC
        ];
        result.put('homeworks', homeworks);

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

        List<Lesson__c> pastToComplete = [
            SELECT Id, Status__c FROM Lesson__c
            WHERE Date_Time__c < :Datetime.now() AND Status__c = 'Scheduled'
        ];
        if (!pastToComplete.isEmpty()) {
            for (Lesson__c l : pastToComplete) l.Status__c = 'Completed';
            update pastToComplete;
        }

        return [
            SELECT Id, Branch__c, Date_Time__c, Duration_Minutes__c, Status__c, Hourly_Rate__c, Total_Fee__c,
                   Student__c, Student__r.First_Name__c, Student__r.Last_Name__c, Student__r.Name, Lesson_Notes__c
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
        update new Lesson__c(Id = lessonId, Status__c = newStatus);
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

    @AuraEnabled
    public static void gradeHomework(String token, Id homeworkId, Decimal grade, String comment, String status) {
        validateTeacherToken(token);
        List<Homework__c> hws = [SELECT Id FROM Homework__c WHERE Id = :homeworkId LIMIT 1];
        if (hws.isEmpty()) throw new AuraHandledException('Ödev bulunamadı.');
        Homework__c hw = hws[0];
        hw.Grade__c = grade;
        hw.Teacher_Comment__c = comment;
        hw.Status__c = status;
        update hw;
    }

    @AuraEnabled
    public static Integer generateWeeklyLessonsFromSchedule(String token) {
        validateTeacherToken(token);
        Date today = Date.today();
        Date knownMonday = Date.newInstance(1900, 1, 1);
        Integer daysBetween = knownMonday.daysBetween(today);
        Integer dayOfWeek = Math.mod(daysBetween, 7);
        Integer daysUntilNextMonday = 7 - dayOfWeek;
        Date nextMonday = today.addDays(daysUntilNextMonday);
        return WeeklyLessonGenerator.generateLessonsForWeek(nextMonday);
    }
}
