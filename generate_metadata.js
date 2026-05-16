const fs = require('fs');
const path = require('path');

const basePath = path.join('d:', 'SALESFORCE', 'projectsOrg', 'force-app', 'main', 'default', 'objects');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function writeXml(filePath, content) {
    fs.writeFileSync(filePath, `<?xml version="1.0" encoding="UTF-8"?>\n${content}`);
}

const objects = {
    Student__c: {
        label: 'Student',
        pluralLabel: 'Students',
        nameFieldType: 'AutoNumber',
        nameFieldLabel: 'Student Number',
        nameFieldFormat: 'STU-{0000}',
        sharingModel: 'ReadWrite',
        fields: {
            First_Name__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>First_Name__c</fullName>
    <externalId>false</externalId>
    <label>First Name</label>
    <length>50</length>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
            Last_Name__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Last_Name__c</fullName>
    <externalId>false</externalId>
    <label>Last Name</label>
    <length>50</length>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
            Username__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Username__c</fullName>
    <externalId>true</externalId>
    <label>Username</label>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Email</type>
    <unique>true</unique>
</CustomField>`,
            Password_Hash__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Password_Hash__c</fullName>
    <externalId>false</externalId>
    <label>Password Hash</label>
    <length>255</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
            Session_Token__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Session_Token__c</fullName>
    <externalId>false</externalId>
    <label>Session Token</label>
    <length>255</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Text</type>
    <unique>true</unique>
</CustomField>`,
            Token_Expiration__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Token_Expiration__c</fullName>
    <externalId>false</externalId>
    <label>Token Expiration</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>DateTime</type>
</CustomField>`,
            Total_Lesson_Fee__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Lesson_Fee__c</fullName>
    <externalId>false</externalId>
    <label>Total Lesson Fee</label>
    <summarizedField>Lesson__c.Total_Fee__c</summarizedField>
    <summaryForeignKey>Lesson__c.Student__c</summaryForeignKey>
    <summaryOperation>sum</summaryOperation>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Summary</type>
</CustomField>`,
            Total_Paid_Amount__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Paid_Amount__c</fullName>
    <externalId>false</externalId>
    <label>Total Paid Amount</label>
    <summarizedField>Payment__c.Amount__c</summarizedField>
    <summaryFilterItems>
        <field>Payment__c.Status__c</field>
        <operation>equals</operation>
        <value>Paid</value>
    </summaryFilterItems>
    <summaryForeignKey>Payment__c.Student__c</summaryForeignKey>
    <summaryOperation>sum</summaryOperation>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Summary</type>
</CustomField>`,
            Balance__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Balance__c</fullName>
    <externalId>false</externalId>
    <formula>Total_Lesson_Fee__c - Total_Paid_Amount__c</formula>
    <formulaTreatBlanksAs>BlankAsZero</formulaTreatBlanksAs>
    <label>Balance</label>
    <precision>18</precision>
    <required>false</required>
    <scale>2</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Currency</type>
</CustomField>`
        }
    },
    Lesson__c: {
        label: 'Lesson',
        pluralLabel: 'Lessons',
        nameFieldType: 'AutoNumber',
        nameFieldLabel: 'Lesson Number',
        nameFieldFormat: 'LES-{0000}',
        sharingModel: 'ControlledByParent',
        fields: {
            Student__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <externalId>false</externalId>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Lessons</relationshipLabel>
    <relationshipName>Lessons</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
            Date_Time__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Date_Time__c</fullName>
    <externalId>false</externalId>
    <label>Date &amp; Time</label>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>DateTime</type>
</CustomField>`,
            Duration_Minutes__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Duration_Minutes__c</fullName>
    <externalId>false</externalId>
    <label>Duration (Minutes)</label>
    <precision>3</precision>
    <required>true</required>
    <scale>0</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Number</type>
    <unique>false</unique>
</CustomField>`,
            Hourly_Rate__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Hourly_Rate__c</fullName>
    <externalId>false</externalId>
    <label>Hourly Rate</label>
    <precision>8</precision>
    <required>true</required>
    <scale>2</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Currency</type>
</CustomField>`,
            Total_Fee__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Fee__c</fullName>
    <externalId>false</externalId>
    <formula>(Duration_Minutes__c / 60) * Hourly_Rate__c</formula>
    <formulaTreatBlanksAs>BlankAsZero</formulaTreatBlanksAs>
    <label>Total Fee</label>
    <precision>18</precision>
    <required>false</required>
    <scale>2</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Currency</type>
</CustomField>`,
            Status__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <externalId>false</externalId>
    <label>Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Scheduled</fullName>
                <default>true</default>
                <label>Scheduled</label>
            </value>
            <value>
                <fullName>Completed</fullName>
                <default>false</default>
                <label>Completed</label>
            </value>
            <value>
                <fullName>Cancelled</fullName>
                <default>false</default>
                <label>Cancelled</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
            Branch__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Branch__c</fullName>
    <externalId>false</externalId>
    <label>Branch</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Matematik</fullName>
                <default>false</default>
                <label>Matematik</label>
            </value>
            <value>
                <fullName>Fizik</fullName>
                <default>false</default>
                <label>Fizik</label>
            </value>
            <value>
                <fullName>Kimya</fullName>
                <default>false</default>
                <label>Kimya</label>
            </value>
            <value>
                <fullName>Geometri</fullName>
                <default>false</default>
                <label>Geometri</label>
            </value>
            <value>
                <fullName>İngilizce</fullName>
                <default>false</default>
                <label>İngilizce</label>
            </value>
            <value>
                <fullName>Türkçe</fullName>
                <default>false</default>
                <label>Türkçe</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`
        }
    },
    Payment__c: {
        label: 'Payment',
        pluralLabel: 'Payments',
        nameFieldType: 'AutoNumber',
        nameFieldLabel: 'Payment Number',
        nameFieldFormat: 'PAY-{0000}',
        sharingModel: 'ControlledByParent',
        fields: {
            Student__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <externalId>false</externalId>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Payments</relationshipLabel>
    <relationshipName>Payments</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
            Amount__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Amount__c</fullName>
    <externalId>false</externalId>
    <label>Amount</label>
    <precision>8</precision>
    <required>true</required>
    <scale>2</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Currency</type>
</CustomField>`,
            Payment_Date__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Payment_Date__c</fullName>
    <externalId>false</externalId>
    <label>Payment Date</label>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Date</type>
</CustomField>`,
            Payment_Method__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Payment_Method__c</fullName>
    <externalId>false</externalId>
    <label>Payment Method</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Cash</fullName>
                <default>false</default>
                <label>Cash</label>
            </value>
            <value>
                <fullName>Bank Transfer</fullName>
                <default>false</default>
                <label>Bank Transfer</label>
            </value>
            <value>
                <fullName>Card</fullName>
                <default>false</default>
                <label>Card</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
            Status__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <externalId>false</externalId>
    <label>Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Pending</fullName>
                <default>true</default>
                <label>Pending</label>
            </value>
            <value>
                <fullName>Paid</fullName>
                <default>false</default>
                <label>Paid</label>
            </value>
            <value>
                <fullName>Refunded</fullName>
                <default>false</default>
                <label>Refunded</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`
        }
    },
    Homework__c: {
        label: 'Homework',
        pluralLabel: 'Homeworks',
        nameFieldType: 'AutoNumber',
        nameFieldLabel: 'Homework Number',
        nameFieldFormat: 'HW-{0000}',
        sharingModel: 'ControlledByParent',
        fields: {
            Student__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <externalId>false</externalId>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Homeworks</relationshipLabel>
    <relationshipName>Homeworks</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
            Lesson__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Lesson__c</fullName>
    <deleteConstraint>SetNull</deleteConstraint>
    <externalId>false</externalId>
    <label>Lesson</label>
    <referenceTo>Lesson__c</referenceTo>
    <relationshipLabel>Homeworks</relationshipLabel>
    <relationshipName>Homeworks</relationshipName>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Lookup</type>
</CustomField>`,
            Title__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Title__c</fullName>
    <externalId>false</externalId>
    <label>Title</label>
    <length>100</length>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
            Description__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Description__c</fullName>
    <externalId>false</externalId>
    <label>Description</label>
    <length>32768</length>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>LongTextArea</type>
    <visibleLines>3</visibleLines>
</CustomField>`,
            Due_Date__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Due_Date__c</fullName>
    <externalId>false</externalId>
    <label>Due Date</label>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Date</type>
</CustomField>`,
            Status__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <externalId>false</externalId>
    <label>Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Assigned</fullName>
                <default>true</default>
                <label>Assigned</label>
            </value>
            <value>
                <fullName>In Progress</fullName>
                <default>false</default>
                <label>In Progress</label>
            </value>
            <value>
                <fullName>Submitted</fullName>
                <default>false</default>
                <label>Submitted</label>
            </value>
            <value>
                <fullName>Completed</fullName>
                <default>false</default>
                <label>Completed</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
            Submission_Link__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Submission_Link__c</fullName>
    <externalId>false</externalId>
    <label>Submission Link</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Url</type>
</CustomField>`,
            Grade__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Grade__c</fullName>
    <externalId>false</externalId>
    <label>Grade</label>
    <precision>3</precision>
    <required>false</required>
    <scale>0</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Number</type>
    <unique>false</unique>
</CustomField>`
        }
    },
    Progress_Exam__c: {
        label: 'Progress Exam',
        pluralLabel: 'Progress Exams',
        nameFieldType: 'AutoNumber',
        nameFieldLabel: 'Exam Number',
        nameFieldFormat: 'EXM-{0000}',
        sharingModel: 'ControlledByParent',
        fields: {
            Student__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <externalId>false</externalId>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Progress Exams</relationshipLabel>
    <relationshipName>Progress_Exams</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
            Date__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Date__c</fullName>
    <externalId>false</externalId>
    <label>Date</label>
    <required>true</required>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Date</type>
</CustomField>`,
            Score__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Score__c</fullName>
    <externalId>false</externalId>
    <label>Score</label>
    <precision>3</precision>
    <required>true</required>
    <scale>0</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Number</type>
    <unique>false</unique>
</CustomField>`,
            Teacher_Feedback__c: `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Teacher_Feedback__c</fullName>
    <externalId>false</externalId>
    <label>Teacher Feedback</label>
    <length>2000</length>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>LongTextArea</type>
    <visibleLines>3</visibleLines>
</CustomField>`
        }
    }
};

for (const [objName, objDef] of Object.entries(objects)) {
    const objDir = path.join(basePath, objName);
    ensureDir(objDir);
    
    // Create object meta
    const objMeta = `<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>${objDef.label}</label>
    <nameField>
        <displayFormat>${objDef.nameFieldFormat}</displayFormat>
        <label>${objDef.nameFieldLabel}</label>
        <type>${objDef.nameFieldType}</type>
    </nameField>
    <pluralLabel>${objDef.pluralLabel}</pluralLabel>
    <searchLayouts/>
    <sharingModel>${objDef.sharingModel}</sharingModel>
</CustomObject>`;
    
    writeXml(path.join(objDir, `${objName}.object-meta.xml`), objMeta);
    
    // Create fields dir
    const fieldsDir = path.join(objDir, 'fields');
    ensureDir(fieldsDir);
    
    // Create field metas
    for (const [fieldName, fieldXml] of Object.entries(objDef.fields)) {
        writeXml(path.join(fieldsDir, `${fieldName}.field-meta.xml`), fieldXml);
    }
}

console.log("Metadata generation complete.");
