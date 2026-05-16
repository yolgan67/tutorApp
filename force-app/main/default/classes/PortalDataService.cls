public without sharing class PortalDataService {
    
    // Helper method to validate token and return the authorized Student ID
    private static Id getAuthorizedStudentId(String sessionToken) {
        if (String.isBlank(sessionToken)) {
            throw new AuraHandledException('Unauthorized Access: Token is missing.');
        }
        
        List<Student__c> students = [
            SELECT Id 
            FROM Student__c 
            WHERE Session_Token__c = :sessionToken 
              AND Token_Expiration__c > :Datetime.now() 
            LIMIT 1
        ];
        
        if (students.isEmpty()) {
            throw new AuraHandledException('Unauthorized Access: Invalid or expired token.');
        }
        
        return students[0].Id;
    }
    
    @AuraEnabled(cacheable=false)
    public static Student__c getStudentProfile(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Username__c, 
                   Total_Lesson_Fee__c, Total_Paid_Amount__c, Balance__c
            FROM Student__c
            WHERE Id = :studentId
            LIMIT 1
        ];
    }
    
    @AuraEnabled(cacheable=false)
    public static List<Lesson__c> getLessons(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        
        return [
            SELECT Id, Name, Date_Time__c, Duration_Minutes__c, Hourly_Rate__c, Total_Fee__c, Status__c, Branch__c
            FROM Lesson__c
            WHERE Student__c = :studentId
            ORDER BY Date_Time__c DESC
        ];
    }
    
    @AuraEnabled(cacheable=false)
    public static List<Homework__c> getHomeworks(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        
        return [
            SELECT Id, Name, Title__c, Description__c, Due_Date__c, Status__c, Submission_Link__c, Grade__c, Lesson__r.Name
            FROM Homework__c
            WHERE Student__c = :studentId
            ORDER BY Due_Date__c ASC
        ];
    }
    
    @AuraEnabled(cacheable=false)
    public static List<Payment__c> getPayments(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        
        return [
            SELECT Id, Name, Amount__c, Payment_Date__c, Payment_Method__c, Status__c
            FROM Payment__c
            WHERE Student__c = :studentId
            ORDER BY Payment_Date__c DESC
        ];
    }
    
    @AuraEnabled(cacheable=false)
    public static List<Progress_Exam__c> getExams(String sessionToken) {
        Id studentId = getAuthorizedStudentId(sessionToken);
        
        return [
            SELECT Id, Name, Date__c, Score__c, Teacher_Feedback__c
            FROM Progress_Exam__c
            WHERE Student__c = :studentId
            ORDER BY Date__c DESC
        ];
    }
}
