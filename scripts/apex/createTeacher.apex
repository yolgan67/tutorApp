// Create Teacher Config
Portal_Config__c config = Portal_Config__c.getOrgDefaults();
if (config == null || config.Id == null) {
    config = new Portal_Config__c();
}
config.Teacher_Username__c = 'admin@tutorsync.com';
upsert config;

// Set Password Hash using the service
CustomAuthService.setTeacherPassword('Admin1234!');

System.debug('Teacher credentials created: admin@tutorsync.com / Admin1234!');
