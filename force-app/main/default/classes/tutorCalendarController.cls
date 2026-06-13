public with sharing class tutorCalendarController {
    
    @AuraEnabled(cacheable=true)
    public static List<LessonEvent> getLessons() {
        List<LessonEvent> events = new List<LessonEvent>();
        
        List<Lesson__c> lessons = [
            SELECT Id, Date_Time__c, Duration_Minutes__c, Branch__c, Status__c, 
                   Student__r.Name, Student__r.First_Name__c, Student__r.Last_Name__c 
            FROM Lesson__c 
            ORDER BY Date_Time__c ASC
            LIMIT 500
        ];
        
        for (Lesson__c l : lessons) {
            LessonEvent ev = new LessonEvent();
            ev.Id = l.Id;
            ev.title = l.Student__r.First_Name__c + ' ' + l.Student__r.Last_Name__c + ' - ' + l.Branch__c;
            ev.startDateTime = l.Date_Time__c;
            
            // Calculate End Time
            if (l.Date_Time__c != null && l.Duration_Minutes__c != null) {
                ev.endDateTime = l.Date_Time__c.addMinutes(Integer.valueOf(l.Duration_Minutes__c));
            } else {
                ev.endDateTime = l.Date_Time__c.addMinutes(60); // Default 1 hr fallback
            }
            
            // Assign colors based on status
            if (l.Status__c == 'Completed') {
                ev.color = '#28a745'; // Green
            } else if (l.Status__c == 'Cancelled') {
                ev.color = '#dc3545'; // Red
            } else {
                ev.color = '#007bff'; // Blue (Scheduled)
            }
            
            events.add(ev);
        }
        
        return events;
    }
    
    // Wrapper class for FullCalendar format
    public class LessonEvent {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String title { get; set; }
        @AuraEnabled public Datetime startDateTime { get; set; }
        @AuraEnabled public Datetime endDateTime { get; set; }
        @AuraEnabled public String color { get; set; }
    }
}