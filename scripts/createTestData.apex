// Delete existing test data to avoid duplicates if run multiple times
delete [SELECT Id FROM Payment__c];
delete [SELECT Id FROM Homework__c];
delete [SELECT Id FROM Lesson__c];
delete [SELECT Id FROM Student__c];

// Create Student
Student__c student = new Student__c(
    First_Name__c = 'Test',
    Last_Name__c = 'User',
    Username__c = 'testuser@portal.com'
);
insert student;

// Set Password
CustomAuthService.setPassword(student.Id, 'password123');

// Create Lesson
Lesson__c lesson = new Lesson__c(
    Student__c = student.Id,
    Date_Time__c = Datetime.now().addDays(2),
    Duration_Minutes__c = 60,
    Hourly_Rate__c = 50,
    Status__c = 'Scheduled'
);
insert lesson;

// Create Homework
Homework__c homework = new Homework__c(
    Student__c = student.Id,
    Lesson__c = lesson.Id,
    Title__c = 'Algebra Fundamentals',
    Description__c = 'Complete exercises 1 to 10 on page 42.',
    Due_Date__c = Date.today().addDays(7),
    Status__c = 'Assigned'
);
insert homework;

// Create Payment
Payment__c payment = new Payment__c(
    Student__c = student.Id,
    Amount__c = 50,
    Payment_Date__c = Date.today(),
    Status__c = 'Pending'
);
insert payment;

System.debug('Test Data Created Successfully! Username: testuser@portal.com | Password: password123');
