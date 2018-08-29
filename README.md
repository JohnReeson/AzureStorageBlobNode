# AzureStorageBlobNode
Code related to Azure Storage Blob written in Node.js

### Note
Only for dev.

### Operations implemented
- createZipFromBlobs (Create zip stream from all blobs with prefix(in specific subfolder) to response in Node.JS Web App)

## Prerequisite
- intall two related packages
```
npm install azure-storage
npm install archiver
```
- add storageConnectionString in createZipFromBlobs.js

## How to use
- put this module in current folder(or any folder we want) and import it
```javascript
var storageOperation = require('./createZipFromBlobs.js');
```
- call the method(use router as an example)
```javascript
router.get('/', function(req, res){
    console.log("start read stream to zip res");
    storageOperation.createZipFromBlobs(res, "containerName", "prefix", parallelRequestCount);
});
```

## Explanation

paralleRequestCount is optional, default is 100. It is used to restrict the parallel request count sent to Storage. 

I use createReadStream method in azure-storage module, which is uesd to open read stream between Web and Storage.

Originally my code sends all requests(based on blob count, no limit) to Storage. I met `ECONNREST` error due to two many read stream are openned and can't be closed in time.
So I planned to sent at most 5000 once(listblob method can get at most 5000 blobpath once), but I still got `ECONNREST`.

Finally I turn to control the request manually in code(a simple loop), with the parameter paralleRequestCount.

## Last word

I am new to Node.JS, feel free to pull request if you find my code is full of flaws, thanks for your patience.
