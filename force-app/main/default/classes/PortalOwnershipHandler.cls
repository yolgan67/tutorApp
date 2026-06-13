public without sharing class PortalOwnershipHandler {
    public static void handleOwnership(List<SObject> records) {
        // Change owner if record is created by Guest User
        if (UserInfo.getUserType() == 'Guest') {
            Id adminId = '005g5000006pFYjAAM'; 
            for (SObject record : records) {
                try {
                    record.put('OwnerId', adminId);
                } catch (Exception e) {
                    // Record might not have OwnerId (e.g. Master-Detail)
                }
            }
        }
    }
}