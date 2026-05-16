const fs = require('fs');
const path = require('path');

const tabsDir = path.join('d:', 'SALESFORCE', 'projectsOrg', 'force-app', 'main', 'default', 'tabs');
const appsDir = path.join('d:', 'SALESFORCE', 'projectsOrg', 'force-app', 'main', 'default', 'applications');

if (!fs.existsSync(tabsDir)) fs.mkdirSync(tabsDir, { recursive: true });
if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir, { recursive: true });

const objects = ['Student__c', 'Lesson__c', 'Payment__c', 'Homework__c', 'Progress_Exam__c'];
const motifKeys = ['Custom15: People', 'Custom14: Hands', 'Custom41: Stack of Cash', 'Custom83: Pencil', 'Custom11: Star'];

objects.forEach((obj, idx) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>${motifKeys[idx]}</motif>
</CustomTab>`;
    fs.writeFileSync(path.join(tabsDir, `${obj}.tab-meta.xml`), xml);
});

// Also create a tab for the Calendar LWC
const lwcTabXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Tutor Calendar</label>
    <lwcComponent>tutorCalendar</lwcComponent>
    <motif>Custom50: Big top</motif>
</CustomTab>`;
fs.writeFileSync(path.join(tabsDir, `tutorCalendar.tab-meta.xml`), lwcTabXml);


const appXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <brand>
        <headerColor>#0072FF</headerColor>
        <shouldOverrideLogo>false</shouldOverrideLogo>
    </brand>
    <description>TutorSync Internal Management App</description>
    <formFactors>Large</formFactors>
    <formFactors>Small</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <label>TutorSync</label>
    <navType>Standard</navType>
    <tabs>standard-home</tabs>
    <tabs>tutorCalendar</tabs>
    <tabs>Student__c</tabs>
    <tabs>Lesson__c</tabs>
    <tabs>Payment__c</tabs>
    <tabs>Homework__c</tabs>
    <tabs>Progress_Exam__c</tabs>
    <uiType>Lightning</uiType>
</CustomApplication>`;

fs.writeFileSync(path.join(appsDir, `TutorSync.app-meta.xml`), appXml);

console.log("Tabs and App metadata generated successfully.");
