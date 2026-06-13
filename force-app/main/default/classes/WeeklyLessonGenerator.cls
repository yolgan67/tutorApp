public without sharing class WeeklyLessonGenerator implements Schedulable {
    
    public void execute(SchedulableContext sc) {
        // By default, generate lessons for the coming week on schedule
        generateLessonsForNextWeek();
    }
    
    // Automatically generate lessons for the coming week (next Monday through Sunday)
    public static void generateLessonsForNextWeek() {
        Date today = Date.today();
        
        // Find next Monday dynamically and reliably
        Date knownMonday = Date.newInstance(1900, 1, 1);
        Integer daysBetween = knownMonday.daysBetween(today);
        Integer dayOfWeek = Math.mod(daysBetween, 7); // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
        
        Integer daysUntilNextMonday = 7 - dayOfWeek;
        Date nextMonday = today.addDays(daysUntilNextMonday);
        
        generateLessonsForWeek(nextMonday);
    }
    
    // Generate lessons for the week starting at a specific Monday date
    public static Integer generateLessonsForWeek(Date startMonday) {
        Integer createdCount = 0;
        
        // Map of Turkish Day Names to Dates in that week
        Map<String, Date> dayNameToDate = new Map<String, Date>{
            'Pazartesi' => startMonday,
            'Salı' => startMonday.addDays(1),
            'Çarşamba' => startMonday.addDays(2),
            'Perşembe' => startMonday.addDays(3),
            'Cuma' => startMonday.addDays(4),
            'Cumartesi' => startMonday.addDays(5),
            'Pazar' => startMonday.addDays(6)
        };
        
        // Fetch all active recurring schedules
        List<Recurring_Schedule__c> activeSchedules = [
            SELECT Id, Student__c, Day_of_Week__c, Start_Time__c, Duration_Minutes__c, Hourly_Rate__c, Branch__c
            FROM Recurring_Schedule__c
            WHERE Is_Active__c = true
        ];
        
        if (activeSchedules.isEmpty()) {
            return 0;
        }
        
        // Gather student IDs to prevent duplicating lessons
        Set<Id> studentIds = new Set<Id>();
        for (Recurring_Schedule__c sch : activeSchedules) {
            studentIds.add(sch.Student__c);
        }
        
        // Query existing lessons for these students in that week range
        Date endSunday = startMonday.addDays(6);
        Datetime startRange = Datetime.newInstance(startMonday, Time.newInstance(0,0,0,0));
        Datetime endRange = Datetime.newInstance(endSunday, Time.newInstance(23,59,59,999));
        
        List<Lesson__c> existingLessons = [
            SELECT Id, Student__c, Date_Time__c
            FROM Lesson__c
            WHERE Student__c IN :studentIds
              AND Date_Time__c >= :startRange
              AND Date_Time__c <= :endRange
        ];
        
        // Build a unique key set of existing student-time slots
        Set<String> existingSlots = new Set<String>();
        for (Lesson__c l : existingLessons) {
            existingSlots.add(l.Student__c + '_' + l.Date_Time__c.format('yyyy-MM-dd HH:mm'));
        }
        
        List<Lesson__c> lessonsToInsert = new List<Lesson__c>();
        
        for (Recurring_Schedule__c sch : activeSchedules) {
            Date targetDate = dayNameToDate.get(sch.Day_of_Week__c);
            if (targetDate == null) {
                continue;
            }
            
            // Build the Datetime from targetDate and sch.Start_Time__c
            Time startTime = sch.Start_Time__c;
            Datetime targetDatetime = Datetime.newInstance(targetDate, startTime);
            
            // Check if this slot already has a lesson
            String slotKey = sch.Student__c + '_' + targetDatetime.format('yyyy-MM-dd HH:mm');
            if (existingSlots.contains(slotKey)) {
                continue; // Skip to avoid duplicate
            }
            
            Lesson__c newLesson = new Lesson__c(
                Student__c = sch.Student__c,
                Date_Time__c = targetDatetime,
                Duration_Minutes__c = sch.Duration_Minutes__c,
                Hourly_Rate__c = sch.Hourly_Rate__c,
                Branch__c = sch.Branch__c,
                Status__c = 'Scheduled'
            );
            
            lessonsToInsert.add(newLesson);
        }
        
        if (!lessonsToInsert.isEmpty()) {
            insert lessonsToInsert;
            createdCount = lessonsToInsert.size();
        }
        
        return createdCount;
    }
}
