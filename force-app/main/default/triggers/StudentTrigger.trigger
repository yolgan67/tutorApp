trigger StudentTrigger on Student__c (before insert, before update) {
    PortalOwnershipHandler.handleOwnership(Trigger.new);
    
    for (Student__c student : Trigger.new) {
        String firstName = String.isNotBlank(student.First_Name__c) ? student.First_Name__c.trim() : '';
        String lastName = String.isNotBlank(student.Last_Name__c) ? student.Last_Name__c.trim() : '';
        student.Name = (firstName + ' ' + lastName).trim();
        if (String.isBlank(student.Name)) {
            student.Name = student.Username__c;
        }
    }
}