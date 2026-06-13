@IsTest
private class tutorCalendarControllerTest {

    @testSetup
    static void setupData() {
        Student__c testStudent = new Student__c(
            First_Name__c = 'Test',
            Last_Name__c = 'Student',
            Username__c = 'test@student.com'
        );
        insert testStudent;
        
        Lesson__c testLesson = new Lesson__c(
            Student__c = testStudent.Id,
            Date_Time__c = Datetime.now(),
            Duration_Minutes__c = 60,
            Hourly_Rate__c = 100,
            Branch__c = 'Matematik',
            Status__c = 'Scheduled'
        );
        insert testLesson;
    }

    @IsTest
    static void testGetLessons() {
        Test.startTest();
        List<tutorCalendarController.LessonEvent> events = tutorCalendarController.getLessons();
        Test.stopTest();
        
        System.assertEquals(1, events.size(), 'Should return exactly 1 lesson event.');
        System.assert(events[0].title.contains('Test Student'), 'Event title should contain the student name.');
        System.assertEquals('#007bff', events[0].color, 'Scheduled lessons should be blue.');
    }
}