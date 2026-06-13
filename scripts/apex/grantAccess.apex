PermissionSet ps = new PermissionSet(Name = 'TutorPortal_Apex_Access', Label = 'TutorPortal Apex Access');
insert ps;

ApexClass authSvc = [SELECT Id FROM ApexClass WHERE Name = 'CustomAuthService' LIMIT 1];
ApexClass dataSvc = [SELECT Id FROM ApexClass WHERE Name = 'TutorPortalDataService' LIMIT 1];

List<SetupEntityAccess> accesses = new List<SetupEntityAccess>();
accesses.add(new SetupEntityAccess(ParentId = ps.Id, SetupEntityId = authSvc.Id));
accesses.add(new SetupEntityAccess(ParentId = ps.Id, SetupEntityId = dataSvc.Id));
insert accesses;

User guestUser = [SELECT Id FROM User WHERE Profile.Name = 'TutorPortal Profile' LIMIT 1];
PermissionSetAssignment psa = new PermissionSetAssignment(AssigneeId = guestUser.Id, PermissionSetId = ps.Id);
insert psa;
System.debug('Permissions granted to Guest User');
