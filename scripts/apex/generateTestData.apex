// Create Students
List<Student__c> studentsToInsert = new List<Student__c>{
    new Student__c(First_Name__c = 'Ahmet', Last_Name__c = 'Yılmaz', Username__c = 'ahmet.yilmaz@test.com'),
    new Student__c(First_Name__c = 'Ayşe', Last_Name__c = 'Demir', Username__c = 'ayse.demir@test.com')
};
insert studentsToInsert;

// Set passwords
for(Student__c student : studentsToInsert) {
    CustomAuthService.setPassword(student.Id, 'Test1234!');
}

// Create Lessons
List<Lesson__c> lessonsToInsert = new List<Lesson__c>();
lessonsToInsert.add(new Lesson__c(
    Student__c = studentsToInsert[0].Id,
    Branch__c = 'Matematik',
    Date_Time__c = Datetime.now().addDays(1),
    Duration_Minutes__c = 60,
    Hourly_Rate__c = 200,
    Status__c = 'Scheduled'
));
lessonsToInsert.add(new Lesson__c(
    Student__c = studentsToInsert[0].Id,
    Branch__c = 'Fizik',
    Date_Time__c = Datetime.now().addDays(-2),
    Duration_Minutes__c = 90,
    Hourly_Rate__c = 250,
    Status__c = 'Completed'
));
lessonsToInsert.add(new Lesson__c(
    Student__c = studentsToInsert[1].Id,
    Branch__c = 'Kimya',
    Date_Time__c = Datetime.now().addDays(2),
    Duration_Minutes__c = 60,
    Hourly_Rate__c = 200,
    Status__c = 'Scheduled'
));
insert lessonsToInsert;

// Create Homework
List<Homework__c> homeworks = new List<Homework__c>();
homeworks.add(new Homework__c(
    Student__c = studentsToInsert[0].Id,
    Lesson__c = lessonsToInsert[1].Id,
    Title__c = 'Fizik Newton Yasaları',
    Description__c = 'Sayfa 50-60 arası tüm sorular çözülecek.',
    Due_Date__c = Date.today().addDays(5),
    Status__c = 'Assigned'
));
insert homeworks;

System.debug('Test dataları başarıyla oluşturuldu.');
