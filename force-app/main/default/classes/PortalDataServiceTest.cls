@IsTest
private class PortalDataServiceTest {

    @testSetup
    static void setupData() {
        Student__c testStudent = new Student__c(
            First_Name__c = 'Test',
            Last_Name__c = 'User',
            Username__c = 'portaluser@example.com',
            Session_Token__c = 'valid-test-token-1234',
            Token_Expiration__c = Datetime.now().addHours(1)
        );
        insert testStudent;
        
        Lesson__c testLesson = new Lesson__c(
            Student__c = testStudent.Id,
            Date_Time__c = Datetime.now().addDays(1),
            Duration_Minutes__c = 60,
            Hourly_Rate__c = 100,
            Status__c = 'Scheduled'
        );
        insert testLesson;
        
        Homework__c testHomework = new Homework__c(
            Student__c = testStudent.Id,
            Lesson__c = testLesson.Id,
            Title__c = 'Math Test',
            Due_Date__c = Date.today().addDays(2),
            Status__c = 'Assigned'
        );
        insert testHomework;
        
        Payment__c testPayment = new Payment__c(
            Student__c = testStudent.Id,
            Amount__c = 100,
            Payment_Date__c = Date.today(),
            Status__c = 'Paid'
        );
        insert testPayment;
        
        Progress_Exam__c testExam = new Progress_Exam__c(
            Student__c = testStudent.Id,
            Date__c = Date.today(),
            Score__c = 95
        );
        insert testExam;
    }
    
    @IsTest
    static void testValidTokenAccess() {
        Test.startTest();
        String token = 'valid-test-token-1234';
        
        Student__c student = PortalDataService.getStudentProfile(token);
        System.assertEquals('portaluser@example.com', student.Username__c, 'Should return the correct student profile');
        
        List<Lesson__c> lessons = PortalDataService.getLessons(token);
        System.assertEquals(1, lessons.size(), 'Should return 1 lesson');
        
        List<Homework__c> homeworks = PortalDataService.getHomeworks(token);
        System.assertEquals(1, homeworks.size(), 'Should return 1 homework');
        
        List<Payment__c> payments = PortalDataService.getPayments(token);
        System.assertEquals(1, payments.size(), 'Should return 1 payment');
        
        List<Progress_Exam__c> exams = PortalDataService.getExams(token);
        System.assertEquals(1, exams.size(), 'Should return 1 exam');
        
        Test.stopTest();
    }
    
    @IsTest
    static void testInvalidTokenAccess() {
        Test.startTest();
        String invalidToken = 'invalid-token-5678';
        
        try {
            PortalDataService.getStudentProfile(invalidToken);
            System.assert(false, 'Exception should have been thrown for invalid token.');
        } catch (AuraHandledException e) {
            System.assertEquals('Script-thrown exception', e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testExpiredTokenAccess() {
        // Expire the token
        Student__c s = [SELECT Id FROM Student__c WHERE Session_Token__c = 'valid-test-token-1234'];
        s.Token_Expiration__c = Datetime.now().addHours(-1);
        update s;
        
        Test.startTest();
        try {
            PortalDataService.getStudentProfile('valid-test-token-1234');
            System.assert(false, 'Exception should have been thrown for expired token.');
        } catch (AuraHandledException e) {
            System.assertEquals('Script-thrown exception', e.getMessage());
        }
        Test.stopTest();
    }
}
