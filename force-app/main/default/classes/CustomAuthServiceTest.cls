@IsTest
private class CustomAuthServiceTest {
    
    @testSetup
    static void setupData() {
        Student__c testStudent = new Student__c(
            First_Name__c = 'Test',
            Last_Name__c = 'User',
            Username__c = 'testuser@example.com'
        );
        insert testStudent;
        
        // Use the service to set the password (simulating registration)
        CustomAuthService.setPassword(testStudent.Id, 'securePassword123');
    }
    
    @IsTest
    static void testValidLogin() {
        Test.startTest();
        String token = CustomAuthService.login('testuser@example.com', 'securePassword123');
        Test.stopTest();
        
        System.assertNotEquals(null, token, 'Token should not be null upon successful login.');
        
        Student__c updatedStudent = [SELECT Session_Token__c, Token_Expiration__c FROM Student__c WHERE Username__c = 'testuser@example.com'];
        System.assertEquals(token, updatedStudent.Session_Token__c, 'Stored token should match returned token.');
        System.assert(updatedStudent.Token_Expiration__c > Datetime.now(), 'Token expiration should be in the future.');
    }
    
    @IsTest
    static void testInvalidPassword() {
        Test.startTest();
        try {
            CustomAuthService.login('testuser@example.com', 'wrongPassword');
            System.assert(false, 'Exception should have been thrown.');
        } catch (AuraHandledException e) {
            System.assertEquals('Script-thrown exception', e.getMessage(), 'AuraHandledException expected generic message in test context.');
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testInvalidUsername() {
        Test.startTest();
        try {
            CustomAuthService.login('unknown@example.com', 'securePassword123');
            System.assert(false, 'Exception should have been thrown.');
        } catch (AuraHandledException e) {
            System.assertEquals('Script-thrown exception', e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testEmptyCredentials() {
        Test.startTest();
        try {
            CustomAuthService.login('', '');
            System.assert(false, 'Exception should have been thrown.');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
        Test.stopTest();
    }
}
