@IsTest
private class PortalDataServiceTest {

    @testSetup
    static void setupData() {
        // Create parent
        Parent__c testParent = new Parent__c(
            Name = 'Test Parent',
            Phone__c = '5559876543',
            Email__c = 'parent@example.com',
            Session_Token__c = 'parent-token-123',
            Token_Expiration__c = Datetime.now().addHours(2)
        );
        insert testParent;

        // Create sibling students
        Student__c child1 = new Student__c(
            First_Name__c = 'Alice',
            Last_Name__c = 'Smith',
            Username__c = 'alice@example.com',
            Session_Token__c = 'student-token-alice',
            Token_Expiration__c = Datetime.now().addHours(2),
            Parent__c = testParent.Id,
            Grade__c = '10. Sınıf',
            School__c = 'High School'
        );
        Student__c child2 = new Student__c(
            First_Name__c = 'Bob',
            Last_Name__c = 'Smith',
            Username__c = 'bob@example.com',
            Session_Token__c = 'student-token-bob',
            Token_Expiration__c = Datetime.now().addHours(2),
            Parent__c = testParent.Id,
            Grade__c = '5. Sınıf',
            School__c = 'Middle School'
        );
        insert new List<Student__c>{ child1, child2 };
        
        // Create a lesson
        Lesson__c testLesson = new Lesson__c(
            Student__c = child1.Id,
            Date_Time__c = Datetime.now().addDays(1),
            Duration_Minutes__c = 60,
            Hourly_Rate__c = 200,
            Status__c = 'Scheduled'
        );
        insert testLesson;
        
        // Create a homework
        Homework__c testHomework = new Homework__c(
            Student__c = child1.Id,
            Lesson__c = testLesson.Id,
            Title__c = 'Algebra Homework',
            Due_Date__c = Date.today().addDays(2),
            Status__c = 'Assigned'
        );
        insert testHomework;
        
        // Create a payment
        Payment__c testPayment = new Payment__c(
            Student__c = child1.Id,
            Amount__c = 200,
            Payment_Date__c = Date.today(),
            Status__c = 'Paid'
        );
        insert testPayment;
    }
    
    @IsTest
    static void testStudentSubmissions() {
        String token = 'student-token-alice';
        Homework__c hw = [SELECT Id FROM Homework__c LIMIT 1];
        
        Test.startTest();
        // Submit Homework
        PortalDataService.submitHomework(token, hw.Id, 20, 16, 4, 'Done my best!');
        
        // Submit Progress Exam
        PortalDataService.submitPracticeExam(token, 'Algebra Quiz', System.today(), 25, 20, 5, 8, 2);
        Test.stopTest();
        
        // Assertions
        Homework__c updatedHw = [SELECT Status__c, Completed_Questions__c, Correct_Answers__c, Wrong_Answers__c, Student_Comment__c FROM Homework__c WHERE Id = :hw.Id];
        System.assertEquals('Submitted', updatedHw.Status__c);
        System.assertEquals(20, updatedHw.Completed_Questions__c);
        System.assertEquals(16, updatedHw.Correct_Answers__c);
        System.assertEquals(4, updatedHw.Wrong_Answers__c);
        System.assertEquals('Done my best!', updatedHw.Student_Comment__c);
        
        Progress_Exam__c exam = [SELECT Exam_Title__c, Total_Questions__c, Total_Correct__c, Total_Wrong__c, Math_Correct__c, Math_Wrong__c FROM Progress_Exam__c LIMIT 1];
        System.assertEquals('Algebra Quiz', exam.Exam_Title__c);
        System.assertEquals(25, exam.Total_Questions__c);
        System.assertEquals(20, exam.Total_Correct__c);
        System.assertEquals(5, exam.Total_Wrong__c);
    }
    
    @IsTest
    static void testParentActionsAndSiblingLookups() {
        String token = 'parent-token-123';
        
        Test.startTest();
        Parent__c parent = PortalDataService.getParentProfile(token);
        System.assertEquals('Test Parent', parent.Name);
        
        List<Student__c> children = PortalDataService.getParentStudents(token);
        System.assertEquals(2, children.size(), 'Should find 2 sibling student records.');
        
        Id childId = children[0].Id;
        List<Lesson__c> lessons = PortalDataService.getParentStudentLessons(token, childId);
        System.assertNotEquals(0, lessons.size());
        
        List<Homework__c> homeworks = PortalDataService.getParentStudentHomeworks(token, childId);
        System.assertNotEquals(0, homeworks.size());
        
        List<Payment__c> payments = PortalDataService.getParentStudentPayments(token, childId);
        System.assertNotEquals(0, payments.size());
        
        // Create an exam for verification
        Progress_Exam__c testExam = new Progress_Exam__c(
            Student__c = childId,
            Date__c = Date.today(),
            Exam_Title__c = 'Final Math',
            Total_Questions__c = 40,
            Total_Correct__c = 30,
            Total_Wrong__c = 10,
            Math_Correct__c = 15,
            Math_Wrong__c = 5,
            Score__c = 75
        );
        insert testExam;
        
        List<Progress_Exam__c> exams = PortalDataService.getParentStudentExams(token, childId);
        System.assertEquals(1, exams.size());
        Test.stopTest();
    }
}