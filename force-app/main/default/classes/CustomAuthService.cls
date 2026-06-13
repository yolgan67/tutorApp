public without sharing class CustomAuthService {
    
    public class AuthResponse {
        @AuraEnabled public String token { get; set; }
        @AuraEnabled public String role { get; set; }
    }

    public class RoleResponse {
        @AuraEnabled public String role { get; set; } // 'teacher', 'student', 'parent', 'none'
        @AuraEnabled public String name { get; set; } // Friendly name (e.g. Ahmet Yilmaz)
    }

    @AuraEnabled
    public static RoleResponse checkEmailRole(String email) {
        if (String.isBlank(email)) {
            throw new AuraHandledException('E-posta alanı boş olamaz.');
        }
        String emailTrimmed = email.trim();
        RoleResponse resp = new RoleResponse();
        
        // 1. Check Teacher from Custom Setting
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        if (config != null && config.Teacher_Username__c != null && config.Teacher_Username__c.equalsIgnoreCase(emailTrimmed)) {
            resp.role = 'teacher';
            resp.name = 'Öğretmen';
            return resp;
        }
        
        // 2. Check Parent__c
        List<Parent__c> parents = [
            SELECT Id, Name 
            FROM Parent__c 
            WHERE Email__c = :emailTrimmed 
            LIMIT 1
        ];
        if (!parents.isEmpty()) {
            resp.role = 'parent';
            resp.name = parents[0].Name;
            return resp;
        }
        
        // 3. Check Student__c
        List<Student__c> students = [
            SELECT Id, Name 
            FROM Student__c 
            WHERE Username__c = :emailTrimmed 
            LIMIT 1
        ];
        if (!students.isEmpty()) {
            resp.role = 'student';
            resp.name = students[0].Name;
            return resp;
        }
        
        resp.role = 'none';
        resp.name = '';
        return resp;
    }

    @AuraEnabled
    public static AuthResponse login(String username, String clearTextPassword) {
        if (String.isBlank(username) || String.isBlank(clearTextPassword)) {
            throw new AuraHandledException('Username and password are required.');
        }
        
        // Hash the incoming password
        Blob targetBlob = Blob.valueOf(clearTextPassword);
        Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
        String hashedString = EncodingUtil.convertToHex(hash);
        
        // 1. Check Parent First
        List<Parent__c> parents = [
            SELECT Id, Password_Hash__c 
            FROM Parent__c 
            WHERE Email__c = :username 
            LIMIT 1
        ];
        if (!parents.isEmpty()) {
            Parent__c parent = parents[0];
            if (parent.Password_Hash__c == hashedString) {
                String sessionToken = generateSessionToken();
                parent.Session_Token__c = sessionToken;
                parent.Token_Expiration__c = Datetime.now().addHours(2);
                update parent;
                
                AuthResponse resp = new AuthResponse();
                resp.token = sessionToken;
                resp.role = 'parent';
                return resp;
            }
        }
        
        // 2. Check Student
        List<Student__c> students = [
            SELECT Id, Password_Hash__c 
            FROM Student__c 
            WHERE Username__c = :username 
            LIMIT 1
        ];
        
        if (!students.isEmpty()) {
            Student__c student = students[0];
            if (student.Password_Hash__c == hashedString) {
                String sessionToken = generateSessionToken();
                student.Session_Token__c = sessionToken;
                student.Token_Expiration__c = Datetime.now().addHours(2);
                update student;
                
                AuthResponse resp = new AuthResponse();
                resp.token = sessionToken;
                resp.role = 'student';
                return resp;
            }
        }
        
        // 3. Check Teacher from Custom Setting
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        if (config != null && config.Teacher_Username__c == username) {
            if (config.Teacher_Password_Hash__c == hashedString) {
                String sessionToken = generateSessionToken();
                config.Teacher_Session_Token__c = sessionToken;
                config.Teacher_Token_Expiration__c = Datetime.now().addHours(2);
                update config;
                
                AuthResponse resp = new AuthResponse();
                resp.token = sessionToken;
                resp.role = 'teacher';
                return resp;
            }
        }
        
        throw new AuraHandledException('Invalid username or password.');
    }
    
    // Helper to generate a secure pseudo-UUID token
    private static String generateSessionToken() {
        Blob b = Crypto.GenerateAESKey(128);
        String h = EncodingUtil.ConvertTohex(b);
        String guid = h.SubString(0,8)+ '-' + h.SubString(8,12) + '-' + h.SubString(12,16) + '-' + h.SubString(16,20) + '-' + h.substring(20);
        return guid;
    }
    
    // Utility to set initial password for Student
    @AuraEnabled
    public static void setPassword(Id studentId, String newPassword) {
        if (String.isBlank(newPassword)) {
            throw new AuraHandledException('Password cannot be empty.');
        }
        
        Blob targetBlob = Blob.valueOf(newPassword);
        Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
        String hashedString = EncodingUtil.convertToHex(hash);
        
        Student__c student = new Student__c(Id = studentId);
        student.Password_Hash__c = hashedString;
        update student;
    }
    
    // Utility to set initial password for Parent
    @AuraEnabled
    public static void setParentPassword(Id parentId, String newPassword) {
        if (String.isBlank(newPassword)) {
            throw new AuraHandledException('Password cannot be empty.');
        }
        
        Blob targetBlob = Blob.valueOf(newPassword);
        Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
        String hashedString = EncodingUtil.convertToHex(hash);
        
        Parent__c parent = new Parent__c(Id = parentId);
        parent.Password_Hash__c = hashedString;
        update parent;
    }

    // Utility to set Teacher password in Custom Setting
    @AuraEnabled
    public static void setTeacherPassword(String newPassword) {
        if (String.isBlank(newPassword)) {
            throw new AuraHandledException('Password cannot be empty.');
        }
        
        Blob targetBlob = Blob.valueOf(newPassword);
        Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
        String hashedString = EncodingUtil.convertToHex(hash);
        
        Portal_Config__c config = Portal_Config__c.getOrgDefaults();
        if (config == null || config.Id == null) {
            config = new Portal_Config__c();
        }
        config.Teacher_Password_Hash__c = hashedString;
        upsert config;
    }

    // Secure method to change password from Portal
    @AuraEnabled
    public static void changePassword(String sessionToken, String role, String currentPassword, String newPassword) {
        if (String.isBlank(sessionToken) || String.isBlank(role) || String.isBlank(currentPassword) || String.isBlank(newPassword)) {
            throw new AuraHandledException('Tüm alanlar zorunludur.');
        }
        
        Blob targetBlobCur = Blob.valueOf(currentPassword);
        Blob hashCur = Crypto.generateDigest('SHA-256', targetBlobCur);
        String hashedCurrent = EncodingUtil.convertToHex(hashCur);
        
        Blob targetBlobNew = Blob.valueOf(newPassword);
        Blob hashNew = Crypto.generateDigest('SHA-256', targetBlobNew);
        String hashedNew = EncodingUtil.convertToHex(hashNew);
        
        if (role == 'student') {
            List<Student__c> students = [
                SELECT Id, Password_Hash__c 
                FROM Student__c 
                WHERE Session_Token__c = :sessionToken AND Token_Expiration__c > :Datetime.now() 
                LIMIT 1
            ];
            if (students.isEmpty()) {
                throw new AuraHandledException('Oturum süresi dolmuş veya geçersiz.');
            }
            Student__c student = students[0];
            if (student.Password_Hash__c != hashedCurrent) {
                throw new AuraHandledException('Mevcut şifreniz hatalı.');
            }
            student.Password_Hash__c = hashedNew;
            update student;
        } else if (role == 'parent') {
            List<Parent__c> parents = [
                SELECT Id, Password_Hash__c 
                FROM Parent__c 
                WHERE Session_Token__c = :sessionToken AND Token_Expiration__c > :Datetime.now() 
                LIMIT 1
            ];
            if (parents.isEmpty()) {
                throw new AuraHandledException('Oturum süresi dolmuş veya geçersiz.');
            }
            Parent__c parent = parents[0];
            if (parent.Password_Hash__c != hashedCurrent) {
                throw new AuraHandledException('Mevcut şifreniz hatalı.');
            }
            parent.Password_Hash__c = hashedNew;
            update parent;
        } else if (role == 'teacher') {
            Portal_Config__c config = Portal_Config__c.getOrgDefaults();
            if (config == null || config.Teacher_Session_Token__c != sessionToken || config.Teacher_Token_Expiration__c < Datetime.now()) {
                throw new AuraHandledException('Oturum süresi dolmuş veya geçersiz.');
            }
            if (config.Teacher_Password_Hash__c != hashedCurrent) {
                throw new AuraHandledException('Mevcut şifreniz hatalı.');
            }
            config.Teacher_Password_Hash__c = hashedNew;
            update config;
        } else {
            throw new AuraHandledException('Geçersiz rol.');
        }
    }
}