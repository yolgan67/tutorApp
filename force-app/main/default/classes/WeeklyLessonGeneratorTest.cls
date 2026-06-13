@IsTest
private class WeeklyLessonGeneratorTest {
    
    @IsTest
    static void testWeeklyLessonGeneratorExecution() {
        // Create mock student
        Student__c s = new Student__c(
            First_Name__c = 'Emily',
            Last_Name__c = 'Davis',
            Username__c = 'emily@example.com',
            Grade__c = '8. Sınıf',
            School__c = 'Science Academy'
        );
        insert s;
        
        // Create recurring weekly schedule templates
        List<Recurring_Schedule__c> templates = new List<Recurring_Schedule__c>{
            new Recurring_Schedule__c(
                Student__c = s.Id,
                Day_Of_Week__c = 'Pazartesi',
                Start_Time__c = Time.newInstance(14, 30, 0, 0),
                Branch__c = 'Matematik',
                Duration_Minutes__c = 90,
                Hourly_Rate__c = 150,
                Is_Active__c = true
            ),
            new Recurring_Schedule__c(
                Student__c = s.Id,
                Day_Of_Week__c = 'Çarşamba',
                Start_Time__c = Time.newInstance(16, 00, 0, 0),
                Branch__c = 'Matematik',
                Duration_Minutes__c = 60,
                Hourly_Rate__c = 150,
                Is_Active__c = true
            )
        };
        insert templates;
        
        Test.startTest();
        // Invoke generator for a target Monday date
        Date targetMonday = Date.newInstance(2026, 6, 1); // 1st June 2026 is a Monday
        Integer count = WeeklyLessonGenerator.generateLessonsForWeek(targetMonday);
        
        // Verify duplicates are ignored if run twice!
        Integer countAgain = WeeklyLessonGenerator.generateLessonsForWeek(targetMonday);
        
        // Execute the schedulable wrapper
        String jobName = 'TestWeeklyLessonGeneratorSchedule';
        String cronStr = '0 0 0 ? * MON';
        System.schedule(jobName, cronStr, new WeeklyLessonGenerator());
        
        Test.stopTest();
        
        // Assertions
        System.assertEquals(2, count, 'Two lessons should have been generated from templates.');
        System.assertEquals(0, countAgain, 'Running generator again for same week should create 0 lessons due to overlap/duplicate prevention.');
        
        // Query created lessons to inspect dates
        Datetime startLimit = Datetime.newInstance(2026, 6, 1, 0, 0, 0);
        List<Lesson__c> createdLessons = [
            SELECT Date_Time__c, Branch__c, Duration_Minutes__c, Hourly_Rate__c 
            FROM Lesson__c 
            WHERE Student__c = :s.Id 
              AND Date_Time__c >= :startLimit
            ORDER BY Date_Time__c ASC
        ];
        System.assertEquals(2, createdLessons.size());
        
        // Monday lesson should be June 1st at 14:30
        System.assertEquals(Datetime.newInstance(2026, 6, 1, 14, 30, 0), createdLessons[0].Date_Time__c);
        // Wednesday lesson should be June 3rd at 16:00
        System.assertEquals(Datetime.newInstance(2026, 6, 3, 16, 0, 0), createdLessons[1].Date_Time__c);
    }
}
