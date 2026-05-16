# Skill Name: Salesforce TutorSync Metadata Creator
# Description: Generates custom objects, fields, roll-ups, and relationships based on v2.0.0 architecture.
# Version: 2.0.0

## System Context
You are a Salesforce Metadata Architect. Your job is to deploy the complete database schema for the Tutor Management app using Tooling or Metadata API.

## Data Model Definition

### 1. Object: Student__c
*   **Fields:**
    *   `Name` (Text - Auto Number: `STU-{0000}`)
    *   `First_Name__c` (Text, 50, Required)
    *   `Last_Name__c` (Text, 50, Required)
    *   `Username__c` (Email, Unique, External ID, Required)
    *   `Password_Hash__c` (Text, 255)
    *   `Session_Token__c` (Text, 255, Unique)
    *   `Token_Expiration__c` (DateTime)
    *   `Total_Lesson_Fee__c` (Roll-up Summary: SUM of Lesson__c.Total_Fee__c)
    *   `Total_Paid_Amount__c` (Roll-up Summary: SUM of Payment__c.Amount__c where Status__c = 'Paid')
    *   `Balance__c` (Formula Currency: `Total_Lesson_Fee__c - Total_Paid_Amount__c`)

### 2. Object: Lesson__c
*   **Fields:**
    *   `Student__c` (Master-Detail to Student__c)
    *   `Date_Time__c` (Date/Time, Required)
    *   `Duration_Minutes__c` (Number, 3, 0, Required)
    *   `Hourly_Rate__c` (Currency, 8, 2, Required)
    *   `Total_Fee__c` (Formula Currency: `Duration_Minutes__c / 60 * Hourly_Rate__c`)
    *   `Status__c` (Picklist: Scheduled, Completed, Cancelled)
    *   `Branch__c` (Picklist: Matematik, Fizik, Kimya, Geometri, İngilizce, Türkçe)

### 3. Object: Payment__c
*   **Fields:**
    *   `Student__c` (Master-Detail to Student__c)
    *   `Amount__c` (Currency, 8, 2, Required)
    *   `Payment_Date__c` (Date, Required)
    *   `Payment_Method__c` (Picklist: Cash, Bank Transfer, Card)
    *   `Status__c` (Picklist: Pending, Paid, Refunded)

### 4. Object: Homework__c
*   **Fields:**
    *   `Student__c` (Master-Detail to Student__c)
    *   `Lesson__c` (Lookup to Lesson__c, Optional)
    *   `Title__c` (Text, 100, Required)
    *   `Description__c` (Long Text Area, 32768)
    *   `Due_Date__c` (Date, Required)
    *   `Status__c` (Picklist: Assigned, In Progress, Submitted, Completed)
    *   `Submission_Link__c` (URL)
    *   `Grade__c` (Number, 3, 0)

### 5. Object: Progress_Exam__c
*   **Fields:**
    *   `Student__c` (Master-Detail to Student__c)
    *   `Date__c` (Date, Required)
    *   `Score__c` (Number, 3, 0, Required)
    *   `Teacher_Feedback__c` (Long Text Area, 2000)

## Execution Instructions
1. Deploy objects in order of independence (Student__c first, then dependent details).
2. Ensure Roll-up summary fields are deployed after the Master-Detail relationships are active.