// Which Knowledge__kav record types can the running user actually assign?
System.debug('Running user profile: ' + [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId()][0].Profile.Name);
Schema.DescribeSObjectResult d = Knowledge__kav.SObjectType.getDescribe();
for (Schema.RecordTypeInfo rti : d.getRecordTypeInfos()) {
    System.debug('RT ' + rti.getDeveloperName()
        + ' | available=' + rti.isAvailable()
        + ' | default=' + rti.isDefaultRecordTypeMapping()
        + ' | id=' + rti.getRecordTypeId());
}
