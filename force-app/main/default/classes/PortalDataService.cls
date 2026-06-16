public without sharing class PortalDataService {

    private static Id getAuthorizedStudentId(String sessionToken) {
        if (String.isBlank(sessionToken)) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        List<Student__c> students = [
            SELECT Id FROM Student__c
            WHERE Session_Token__c = :sessionToken AND Token_Expiration__c > :Datetime.now()
            LIMIT 1
        ];
        if (students.isEmpty()) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        return students[0].Id;
    }

    private static Id getAuthorizedParentId(String sessionToken) {
        if (String.isBlank(sessionToken)) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        List<Parent__c> parents = [
            SELECT Id FROM Parent__c
            WHERE Session_Token__c = :sessionToken AND Token_Expiration__c > :Datetime.now()
            LIMIT 1
        ];
        if (parents.isEmpty()) {
            throw new AuraHandledException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        return parents[0].Id;
    }

    @AuraEnabled(cacheable=false)
    public static Student__c getStudentProfile(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Username__c, Grade__c, School__c,
                   Registration_Date__c, Student_Type__c, Target_Exam_Date__c
            FROM Student__c
            WHERE Id = :studentId
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Lesson__c> getLessons(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        return [
            SELECT Id, Name, Date_Time__c, Duration_Minutes__c, Status__c, Branch__c, Lesson_Notes__c
            FROM Lesson__c
            WHERE Student__c = :studentId
            ORDER BY Date_Time__c DESC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Homework__c> getHomeworks(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        return [
            SELECT Id, Name, Title__c, Description__c, Due_Date__c, Status__c, Submission_Link__c, Grade__c, Lesson__r.Name,
                   Completed_Questions__c, Correct_Answers__c, Wrong_Answers__c, Student_Comment__c, Teacher_Comment__c
            FROM Homework__c
            WHERE Student__c = :studentId
            ORDER BY Due_Date__c ASC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Payment__c> getPayments(String sessionToken) {
        return new List<Payment__c>(); // Financial privacy: students cannot see payments
    }

    @AuraEnabled(cacheable=false)
    public static List<Progress_Exam__c> getExams(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        return [
            SELECT Id, Name, Exam_Title__c, Date__c, Total_Questions__c, Total_Correct__c, Total_Wrong__c,
                   Math_Correct__c, Math_Wrong__c, Total_Net__c, Math_Net__c, Score__c, Teacher_Feedback__c
            FROM Progress_Exam__c
            WHERE Student__c = :studentId
            ORDER BY Date__c DESC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static void submitHomework(String sessionToken, Id homeworkId, Decimal completedQuestions, Decimal corrects, Decimal wrongs, String comment) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        List<Homework__c> hws = [SELECT Id, Student__c FROM Homework__c WHERE Id = :homeworkId AND Student__c = :studentId LIMIT 1];
        if (hws.isEmpty()) throw new AuraHandledException('Ödev bulunamadı veya yetkiniz yok.');
        Homework__c hw = hws[0];
        hw.Status__c = 'Submitted';
        hw.Completed_Questions__c = completedQuestions;
        hw.Correct_Answers__c = corrects;
        hw.Wrong_Answers__c = wrongs;
        hw.Student_Comment__c = comment;
        update hw;
    }

    @AuraEnabled(cacheable=false)
    public static void submitPracticeExam(String sessionToken, String title, Date examDate, Decimal totalQuestions, Decimal totalCorrect, Decimal totalWrong, Decimal mathCorrect, Decimal mathWrong) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        Progress_Exam__c exam = new Progress_Exam__c(
            Student__c = studentId,
            Exam_Title__c = title,
            Date__c = examDate,
            Total_Questions__c = totalQuestions,
            Total_Correct__c = totalCorrect,
            Total_Wrong__c = totalWrong,
            Math_Correct__c = mathCorrect,
            Math_Wrong__c = mathWrong,
            Score__c = (totalCorrect != null && totalQuestions != null && totalQuestions > 0) ? (totalCorrect * 100 / totalQuestions).intValue() : 0
        );
        insert exam;
    }

    // ==========================================
    // PARENT PORTAL METHODS
    // ==========================================

    @AuraEnabled(cacheable=false)
    public static Parent__c getParentProfile(String sessionToken) {
        Id parentId = getAuthorizedParentId(sessionToken);
        return [SELECT Id, Name, Email__c, Phone__c FROM Parent__c WHERE Id = :parentId LIMIT 1];
    }

    @AuraEnabled(cacheable=false)
    public static List<Student__c> getParentStudents(String sessionToken) {
        Id parentId = getAuthorizedParentId(sessionToken);
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Grade__c, School__c, Registration_Date__c,
                   Total_Lesson_Fee__c, Total_Paid_Amount__c, Balance__c, Student_Type__c, Target_Exam_Date__c
            FROM Student__c
            WHERE Parent__c = :parentId
            ORDER BY Name ASC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Lesson__c> getParentStudentLessons(String sessionToken, Id studentId) {
        getAuthorizedParentId(sessionToken);
        return [
            SELECT Id, Name, Date_Time__c, Duration_Minutes__c, Hourly_Rate__c, Total_Fee__c, Status__c, Branch__c, Lesson_Notes__c
            FROM Lesson__c
            WHERE Student__c = :studentId
            ORDER BY Date_Time__c DESC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Homework__c> getParentStudentHomeworks(String sessionToken, Id studentId) {
        getAuthorizedParentId(sessionToken);
        return [
            SELECT Id, Name, Title__c, Description__c, Due_Date__c, Status__c, Submission_Link__c, Grade__c, Lesson__r.Name,
                   Completed_Questions__c, Correct_Answers__c, Wrong_Answers__c, Student_Comment__c, Teacher_Comment__c
            FROM Homework__c
            WHERE Student__c = :studentId
            ORDER BY Due_Date__c ASC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Payment__c> getParentStudentPayments(String sessionToken, Id studentId) {
        getAuthorizedParentId(sessionToken);
        return [
            SELECT Id, Name, Amount__c, Payment_Date__c, Payment_Method__c, Status__c
            FROM Payment__c
            WHERE Student__c = :studentId
            ORDER BY Payment_Date__c DESC
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Progress_Exam__c> getParentStudentExams(String sessionToken, Id studentId) {
        getAuthorizedParentId(sessionToken);
        return [
            SELECT Id, Name, Exam_Title__c, Date__c, Total_Questions__c, Total_Correct__c, Total_Wrong__c,
                   Math_Correct__c, Math_Wrong__c, Total_Net__c, Math_Net__c, Score__c, Teacher_Feedback__c
            FROM Progress_Exam__c
            WHERE Student__c = :studentId
            ORDER BY Date__c DESC
        ];
    }

    // FIFO gecikme hesabı: tamamlanan dersler en eskiden yeniye sıralanır,
    // ödemeler en eskiyi önce karşılar; karşılanamayan dersler "gecikmiş" döner.
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> getOverduePaymentBreakdown(String sessionToken, Id studentId) {
        getAuthorizedParentId(sessionToken);

        Student__c student = [SELECT Total_Paid_Amount__c FROM Student__c WHERE Id = :studentId LIMIT 1];
        Decimal totalPaid = student.Total_Paid_Amount__c != null ? student.Total_Paid_Amount__c : 0;

        List<Lesson__c> completedLessons = [
            SELECT Id, Name, Date_Time__c, Total_Fee__c, Branch__c
            FROM Lesson__c
            WHERE Student__c = :studentId AND Status__c = 'Completed'
            ORDER BY Date_Time__c ASC
        ];

        List<Map<String, Object>> result = new List<Map<String, Object>>();
        Decimal covered = 0;
        Date today = Date.today();

        for (Lesson__c l : completedLessons) {
            Decimal fee = l.Total_Fee__c != null ? l.Total_Fee__c : 0;
            if (covered + fee <= totalPaid) {
                covered += fee;
            } else {
                Date lessonDate = l.Date_Time__c.date();
                Integer daysOverdue = lessonDate.daysBetween(today);
                Map<String, Object> row = new Map<String, Object>();
                row.put('Id', l.Id);
                row.put('Name', l.Name);
                row.put('dateTimeISO', String.valueOf(l.Date_Time__c));
                row.put('Total_Fee__c', fee);
                row.put('Branch__c', l.Branch__c);
                row.put('daysOverdue', daysOverdue);
                result.add(row);
            }
        }
        return result;
    }
}
