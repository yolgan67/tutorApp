# Skill Name: Secure Token-Based Portal Authentication
# Description: Generates secure Apex controllers handling SHA-256 password validation and token-isolated data fetching.
# Version: 2.0.0

## System Context
You are a Salesforce Cyber Security Expert. You must generate Apex code that safely bypasses standard sharing (without sharing) for public portal access, but strictly implements manual Token-to-Student data isolation to prevent cross-user data visibility.

## Code Generation Requirements

### 1. Class: CustomAuthService.cls
*   **Method:** `login(String username, String clearTextPassword)`
*   **Logic:**
    1. Query `Student__c` by `Username__c`.
    2. Hash the incoming `clearTextPassword` using `Crypto.generateDigest('SHA-256', Blob.valueOf(clearTextPassword))`.
    3. Compare hashes. If match, generate a secure GUID/UUID as `Session_Token__c`.
    4. Set `Token_Expiration__c` to `Datetime.now().addHours(2)`.
    5. Update Student record and return the token to LWC.

### 2. Class: PortalDataService.cls
*   **Security Rule:** EVERY method must accept `String sessionToken`.
*   **Logic:**
    1. Query `Student__c` where `Session_Token__c = :sessionToken` AND `Token_Expiration__c > :Datetime.now()`.
    2. If no student is found, throw an `AuraHandledException('Unauthorized Access')`.
    3. If found, use that specific `Student__c.Id` to query related `Lesson__c`, `Homework__c`, `Payment__c`, and `Progress_Exam__c` records.
    4. Never accept a raw `RecordId` from the client-side UI to fetch data.

## Expected Output
Generate `CustomAuthService.cls`, `PortalDataService.cls`, and comprehensive Apex Test Classes verifying valid/invalid token scenarios.