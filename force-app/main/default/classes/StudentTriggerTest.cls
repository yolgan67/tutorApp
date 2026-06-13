@IsTest
private class StudentTriggerTest {
    
    @IsTest
    static void testStudentNameConcatenation() {
        Test.startTest();
        // Insert student with first and last name
        Student__c s = new Student__c(
            First_Name__c = 'Yunus',
            Last_Name__c = 'Emre',
            Username__c = 'yunus@example.com'
        );
        insert s;
        
        // Assertions
        Student__c queriedStudent = [SELECT Name FROM Student__c WHERE Id = :s.Id];
        System.assertEquals('Yunus Emre', queriedStudent.Name, 'Student name should automatically concatenate.');
        
        // Update student first name
        s.First_Name__c = 'Mehmet';
        update s;
        
        queriedStudent = [SELECT Name FROM Student__c WHERE Id = :s.Id];
        System.assertEquals('Mehmet Emre', queriedStudent.Name, 'Student name should automatically update upon changes.');
        Test.stopTest();
    }
}
