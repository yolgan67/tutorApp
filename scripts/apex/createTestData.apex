// ==========================================
// TutorSync Complete Premium Mock Data Setup
// ==========================================

// 1. Delete all existing portal records to prevent duplicate key/username collisions
delete [SELECT Id FROM Payment__c];
delete [SELECT Id FROM Homework__c];
delete [SELECT Id FROM Progress_Exam__c];
delete [SELECT Id FROM Lesson__c];
delete [SELECT Id FROM Recurring_Schedule__c];
delete [SELECT Id FROM Student__c];
delete [SELECT Id FROM Parent__c];

System.debug('--- Existing portal records cleared cleanly ---');

// 2. Create Portal CONFIG for Teacher Account (If not present)
Portal_Config__c config = Portal_Config__c.getOrgDefaults();
config.Teacher_Username__c = 'ogretmen@tutorsync.com';
upsert config;
CustomAuthService.setTeacherPassword('ogretmen123');
System.debug('Teacher User: ogretmen@tutorsync.com | Password: ogretmen123');

// 3. Create Parents (Veli Hesapları)
Parent__c parentA = new Parent__c(
    Name = 'Kemal Demir',
    Phone__c = '0555 123 45 67',
    Email__c = 'veli.kemal@portal.com'
);
Parent__c parentB = new Parent__c(
    Name = 'Ayşe Kaya',
    Phone__c = '0544 987 65 43',
    Email__c = 'veli.ayse@portal.com'
);
insert new List<Parent__c>{ parentA, parentB };

CustomAuthService.setParentPassword(parentA.Id, 'veliPassword123');
CustomAuthService.setParentPassword(parentB.Id, 'veliPassword123');
System.debug('Parent 1: veli.kemal@portal.com | Password: veliPassword123');
System.debug('Parent 2: veli.ayse@portal.com | Password: veliPassword123');

// 4. Create Students (Öğrenci Hesapları)
// Parent A has two children (Ahmet & Elif)
Student__c studentA1 = new Student__c(
    First_Name__c = 'Ahmet',
    Last_Name__c = 'Demir',
    Username__c = 'ogrenci.ahmet@portal.com',
    Grade__c = '10. Sınıf',
    School__c = 'Atatürk Anadolu Lisesi',
    Parent__c = parentA.Id,
    Registration_Date__c = Date.today().addMonths(-3)
);

Student__c studentA2 = new Student__c(
    First_Name__c = 'Elif',
    Last_Name__c = 'Demir',
    Username__c = 'ogrenci.elif@portal.com',
    Grade__c = '6. Sınıf',
    School__c = 'Cumhuriyet Ortaokulu',
    Parent__c = parentA.Id,
    Registration_Date__c = Date.today().addMonths(-2)
);

// Parent B has one child (Kaan)
Student__c studentB1 = new Student__c(
    First_Name__c = 'Kaan',
    Last_Name__c = 'Kaya',
    Username__c = 'ogrenci.kaan@portal.com',
    Grade__c = '12. Sınıf',
    School__c = 'Fen Lisesi',
    Parent__c = parentB.Id,
    Registration_Date__c = Date.today().addMonths(-1)
);

insert new List<Student__c>{ studentA1, studentA2, studentB1 };

CustomAuthService.setPassword(studentA1.Id, 'ogrenciPassword123');
CustomAuthService.setPassword(studentA2.Id, 'ogrenciPassword123');
CustomAuthService.setPassword(studentB1.Id, 'ogrenciPassword123');

System.debug('Student A1 (Lise 10): ogrenci.ahmet@portal.com | Password: ogrenciPassword123');
System.debug('Student A2 (Orta 6): ogrenci.elif@portal.com | Password: ogrenciPassword123');
System.debug('Student B1 (Lise 12): ogrenci.kaan@portal.com | Password: ogrenciPassword123');

// 5. Create Recurring Schedule templates (Eğitmen Haftalık Ders Program Şablonu)
List<Recurring_Schedule__c> recurringSchedules = new List<Recurring_Schedule__c>{
    new Recurring_Schedule__c(
        Student__c = studentA1.Id,
        Day_Of_Week__c = 'Pazartesi',
        Start_Time__c = Time.newInstance(16, 30, 0, 0),
        Branch__c = 'Matematik',
        Duration_Minutes__c = 90,
        Hourly_Rate__c = 300,
        Is_Active__c = true
    ),
    new Recurring_Schedule__c(
        Student__c = studentA1.Id,
        Day_Of_Week__c = 'Perşembe',
        Start_Time__c = Time.newInstance(17, 00, 0, 0),
        Branch__c = 'Matematik',
        Duration_Minutes__c = 90,
        Hourly_Rate__c = 300,
        Is_Active__c = true
    ),
    new Recurring_Schedule__c(
        Student__c = studentA2.Id,
        Day_Of_Week__c = 'Çarşamba',
        Start_Time__c = Time.newInstance(15, 00, 0, 0),
        Branch__c = 'Matematik',
        Duration_Minutes__c = 60,
        Hourly_Rate__c = 250,
        Is_Active__c = true
    )
};
insert recurringSchedules;

// 6. Create Lessons (Geçmiş ve Planlanan Dersler)
List<Lesson__c> lessons = new List<Lesson__c>{
    new Lesson__c(
        Student__c = studentA1.Id,
        Branch__c = 'Matematik',
        Date_Time__c = Datetime.now().addDays(-4),
        Duration_Minutes__c = 90,
        Hourly_Rate__c = 300,
        Status__c = 'Completed'
    ),
    new Lesson__c(
        Student__c = studentA1.Id,
        Branch__c = 'Matematik',
        Date_Time__c = Datetime.now().addDays(3),
        Duration_Minutes__c = 90,
        Hourly_Rate__c = 300,
        Status__c = 'Scheduled'
    ),
    new Lesson__c(
        Student__c = studentA2.Id,
        Branch__c = 'Matematik',
        Date_Time__c = Datetime.now().addDays(-2),
        Duration_Minutes__c = 60,
        Hourly_Rate__c = 250,
        Status__c = 'Completed'
    ),
    new Lesson__c(
        Student__c = studentA2.Id,
        Branch__c = 'Matematik',
        Date_Time__c = Datetime.now().addDays(4),
        Duration_Minutes__c = 60,
        Hourly_Rate__c = 250,
        Status__c = 'Scheduled'
    )
};
insert lessons;

// 7. Create Homeworks (Ödev Atamaları)
List<Homework__c> homeworks = new List<Homework__c>{
    // Assigned (Ödev Atandı)
    new Homework__c(
        Student__c = studentA1.Id,
        Lesson__c = lessons[1].Id,
        Title__c = 'Trigonometri Formülleri ve Özdeşlikler',
        Description__c = 'Kitap sayfa 150-160 arasındaki tüm testleri çözüp teslim ediniz.',
        Due_Date__c = Date.today().addDays(4),
        Status__c = 'Assigned'
    ),
    // Submitted (Öğrenci Çözdü, Eğitmen Bekliyor)
    new Homework__c(
        Student__c = studentA1.Id,
        Lesson__c = lessons[0].Id,
        Title__c = 'Fonksiyon Grafikleri Ödev Seti',
        Description__c = 'Bileşke fonksiyon grafikleri ve ters alma soruları çözülecek.',
        Due_Date__c = Date.today().addDays(-1),
        Status__c = 'Submitted',
        Completed_Questions__c = 30,
        Correct_Answers__c = 24,
        Wrong_Answers__c = 6,
        Student_Comment__c = 'Hocam bazı grafik çizim sorularını tam çıkaramadım, derste üzerinden geçebilir miyiz?'
    ),
    // Completed (Notlandırılmış / Tamamlanmış)
    new Homework__c(
        Student__c = studentA1.Id,
        Lesson__c = lessons[0].Id,
        Title__c = 'Polinom Bölmesi ve Kalan Teoremi',
        Description__c = 'Kalan bulma ve polinom sadeleştirme alıştırmaları.',
        Due_Date__c = Date.today().addDays(-6),
        Status__c = 'Completed',
        Completed_Questions__c = 20,
        Correct_Answers__c = 19,
        Wrong_Answers__c = 1,
        Student_Comment__c = 'Soruları bitirdim.',
        Grade__c = 95,
        Teacher_Comment__c = 'Ahmet harika bir iş çıkarmışsın! Hatalı yaptığın tek soru da basit işlem hatasından kaynaklanıyor. Tebrikler!'
    )
};
insert homeworks;

// 8. Create Progress Exams (Deneme Sınavı Netleri)
List<Progress_Exam__c> exams = new List<Progress_Exam__c>{
    // Ahmet Demir (Lise 10. Sınıf -> 3 Yanlış 1 Doğruyu Götürür!)
    new Progress_Exam__c(
        Student__c = studentA1.Id,
        Date__c = Date.today().addDays(-12),
        Exam_Title__c = 'Genel Başarı Tarama Denemesi',
        Total_Questions__c = 120,
        Total_Correct__c = 90,
        Total_Wrong__c = 18,
        Math_Correct__c = 35,
        Math_Wrong__c = 3,
        Score__c = 75,
        Teacher_Feedback__c = 'Matematik netin çok üst düzeyde, genel Türkçeye biraz daha zaman ayırmalısın.'
    ),
    new Progress_Exam__c(
        Student__c = studentA1.Id,
        Date__c = Date.today().addDays(-25),
        Exam_Title__c = 'ÖZDEBİR Türkiye Geneli Lise Denemesi',
        Total_Questions__c = 120,
        Total_Correct__c = 82,
        Total_Wrong__c = 15,
        Math_Correct__c = 31,
        Math_Wrong__c = 6,
        Score__c = 68,
        Teacher_Feedback__c = 'İlk deneme için gayet istikrarlı bir sonuç. Netlerini artıracağız.'
    ),
    // Elif Demir (Ortaokul 6. Sınıf -> 4 Yanlış 1 Doğruyu Götürür!)
    new Progress_Exam__c(
        Student__c = studentA2.Id,
        Date__c = Date.today().addDays(-8),
        Exam_Title__c = '6. Sınıf Okul Hazırlık Sınavı',
        Total_Questions__c = 60,
        Total_Correct__c = 52,
        Total_Wrong__c = 8,
        Math_Correct__c = 16,
        Math_Wrong__c = 4,
        Score__c = 87,
        Teacher_Feedback__c = 'Aferin Elif! Matematik ve Fen sorularında harika odaklanmışsın.'
    )
};
insert exams;

// 9. Create Payments (Ödemeler)
List<Payment__c> payments = new List<Payment__c>{
    new Payment__c(
        Student__c = studentA1.Id,
        Amount__c = 500,
        Payment_Date__c = Date.today().addDays(-15),
        Payment_Method__c = 'Bank Transfer',
        Status__c = 'Paid'
    ),
    new Payment__c(
        Student__c = studentA2.Id,
        Amount__c = 250,
        Payment_Date__c = Date.today().addDays(-5),
        Payment_Method__c = 'Cash',
        Status__c = 'Paid'
    )
};
insert payments;

System.debug('==================================================');
System.debug(' Premium TutorSync Mock Data Setup Completed! ');
System.debug('==================================================');
