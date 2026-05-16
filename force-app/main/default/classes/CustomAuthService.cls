public without sharing class CustomAuthService {
    
    @AuraEnabled
    public static String login(String username, String clearTextPassword) {
        if (String.isBlank(username) || String.isBlank(clearTextPassword)) {
            throw new AuraHandledException('Username and password are required.');
        }
        
        List<Student__c> students = [
            SELECT Id, Password_Hash__c 
            FROM Student__c 
            WHERE Username__c = :username 
            LIMIT 1
        ];
        
        if (students.isEmpty()) {
            throw new AuraHandledException('Invalid username or password.');
        }
        
        Student__c student = students[0];
        
        // Hash the incoming password
        Blob targetBlob = Blob.valueOf(clearTextPassword);
        Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
        String hashedString = EncodingUtil.convertToHex(hash);
        
        // Compare hashes
        if (student.Password_Hash__c == hashedString) {
            // Generate a secure Token (UUID-like)
            String sessionToken = generateSessionToken();
            
            // Update Student with Token and Expiration
            student.Session_Token__c = sessionToken;
            student.Token_Expiration__c = Datetime.now().addHours(2);
            
            update student;
            
            return sessionToken;
        } else {
            throw new AuraHandledException('Invalid username or password.');
        }
    }
    
    // Helper to generate a secure pseudo-UUID token
    private static String generateSessionToken() {
        Blob b = Crypto.GenerateAESKey(128);
        String h = EncodingUtil.ConvertTohex(b);
        String guid = h.SubString(0,8)+ '-' + h.SubString(8,12) + '-' + h.SubString(12,16) + '-' + h.SubString(16,20) + '-' + h.substring(20);
        return guid;
    }
    
    // Utility to set initial password (for admin or registration flow)
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
}
