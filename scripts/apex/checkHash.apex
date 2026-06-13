Blob targetBlob = Blob.valueOf('Admin1234!');
Blob hash = Crypto.generateDigest('SHA-256', targetBlob);
String hashedString = EncodingUtil.convertToHex(hash);
System.debug('HASH: ' + hashedString);
