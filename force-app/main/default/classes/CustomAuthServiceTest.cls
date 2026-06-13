@IsTest
private class CustomAuthServiceTest {
    
    @testSetup
    static void setupData() {
        // Create student
        Student__c testStudent = new Student__c(
            First_Name__c = 'Test',
            Last_Name__c = 'User',
            Username__c = 'student@example.com'
        );
        insert testStudent;
        CustomAuthService.setPassword(testStudent.Id, 'securePassword123');

        // Create parent
        Parent__c testParent = new Parent__c(
            Name = 'Test Parent',
            Phone__c = '5551234567',
            Email__c = 'parent@example.com'
        );
        insert testParent;
        CustomAuthService.setParentPassword(testParent.Id, 'parentPassword123');
    }
    
    @IsTest
    static void testCheckEmailRole() {
        // Teacher config setup
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        config.Teacher_Username__c = 'teacher@example.com';
        upsert config;

        Test.startTest();
        CustomAuthService.RoleResponse resStudent = CustomAuthService.checkEmailRole('student@example.com');
        CustomAuthService.RoleResponse resParent = CustomAuthService.checkEmailRole('parent@example.com');
        CustomAuthService.RoleResponse resTeacher = CustomAuthService.checkEmailRole('teacher@example.com');
        CustomAuthService.RoleResponse resUnknown = CustomAuthService.checkEmailRole('unknown@example.com');
        Test.stopTest();

        System.assertEquals('student', resStudent.role);
        System.assertEquals('parent', resParent.role);
        System.assertEquals('teacher', resTeacher.role);
        System.assertEquals('none', resUnknown.role);
    }
    
    @IsTest
    static void testStudentValidLogin() {
        Test.startTest();
        CustomAuthService.AuthResponse response = CustomAuthService.login('student@example.com', 'securePassword123');
        Test.stopTest();
        
        System.assertNotEquals(null, response);
        System.assertEquals('student', response.role);
    }

    @IsTest
    static void testParentValidLogin() {
        Test.startTest();
        CustomAuthService.AuthResponse response = CustomAuthService.login('parent@example.com', 'parentPassword123');
        Test.stopTest();
        
        System.assertNotEquals(null, response);
        System.assertEquals('parent', response.role);
    }
    
    @IsTest
    static void testTeacherLogin() {
        CustomAuthService.setTeacherPassword('teacherPass');
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        config.Teacher_Username__c = 'teacher@example.com';
        update config;
        
        Test.startTest();
        CustomAuthService.AuthResponse response = CustomAuthService.login('teacher@example.com', 'teacherPass');
        Test.stopTest();
        
        System.assertNotEquals(null, response);
        System.assertEquals('teacher', response.role);
    }
    
    @IsTest
    static void testInvalidLoginExceptions() {
        Test.startTest();
        try {
            CustomAuthService.login('student@example.com', 'wrongPassword');
            System.assert(false, 'Should throw an exception');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
        
        try {
            CustomAuthService.login('parent@example.com', 'wrongPassword');
            System.assert(false, 'Should throw an exception');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testChangePassword() {
        // Change Student Password
        CustomAuthService.AuthResponse loginRes = CustomAuthService.login('student@example.com', 'securePassword123');
        
        Test.startTest();
        CustomAuthService.changePassword(loginRes.token, 'student', 'securePassword123', 'newStudentPass123');
        
        // Change Parent Password
        CustomAuthService.AuthResponse parentLoginRes = CustomAuthService.login('parent@example.com', 'parentPassword123');
        CustomAuthService.changePassword(parentLoginRes.token, 'parent', 'parentPassword123', 'newParentPass123');
        
        // Change Teacher Password
        CustomAuthService.setTeacherPassword('teacherPass');
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        config.Teacher_Username__c = 'teacher@example.com';
        update config;
        CustomAuthService.AuthResponse teacherLoginRes = CustomAuthService.login('teacher@example.com', 'teacherPass');
        CustomAuthService.changePassword(teacherLoginRes.token, 'teacher', 'teacherPass', 'newTeacherPass123');
        Test.stopTest();
        
        // Validate password change by logging in with new passwords
        System.assertNotEquals(null, CustomAuthService.login('student@example.com', 'newStudentPass123'));
        System.assertNotEquals(null, CustomAuthService.login('parent@example.com', 'newParentPass123'));
        System.assertNotEquals(null, CustomAuthService.login('teacher@example.com', 'newTeacherPass123'));
    }
}