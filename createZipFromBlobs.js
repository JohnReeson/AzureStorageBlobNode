const azure = require('azure-storage');
const archiver = require('archiver');
const storageConnectionString = 'xxx';
const blobService = azure.createBlobService(storageConnectionString);

let prefix = "";
let container = "";
let continuationToken = null;
let blobCount = 0;
let blobResults = [];
// once met error ECONNREST , try to assign a lower count
let parallelrequest = 100;

// list at most 5000 blobs once
const listBlobsSegmented = () => {
    return new Promise((resolve, reject) => {
        blobService.listBlobsSegmentedWithPrefix(container, prefix, continuationToken, (err, results) => {
            if (err) {
                reject(err);
            } else {
                continuationToken = results.continuationToken;
                blobResults = results.entries;
                resolve("done");
            }
        });
    });
};

const zipOneBlob = (blobName) => {
    return new Promise((resolve, reject) => {
        blobService.createReadStream(container, blobName, err => {
            if (err) {
                reject(err);
            }
        }).on('data', data => {
            zip.append(data, { name: blobName });
            resolve("done");
        }).on('error', err => {
            reject(err);
        });
    });
};

// restrict parallel count of request to storage, 100 one time
const zipBlobsSegmented = (var1, var2) => {

    let zippedCount = var1;
    let leftCount = var2;

    let promises = [];
    let length = leftCount < parallelrequest ? leftCount : parallelrequest;

    for (let i = zippedCount; i < length + zippedCount; i++) {
        let promise = zipOneBlob(blobResults[i].name);
        promises.push(promise);
    }
    return Promise.all(promises).then(() => {
        zippedCount += length;
        leftCount -= length;
        return leftCount > 0 ? zipBlobsSegmented(zippedCount, leftCount) : Promise.resolve();
    });
};

// list and download
const listAndDownloadBlobs = () => {
    return listBlobsSegmented().then(() => {
        return zipBlobsSegmented(0, blobResults.length);
    }).then(() => {
        blobCount += blobResults.length;
        return continuationToken ? listAndDownloadBlobs() : Promise.resolve();
    }).catch(err => {
        console.log(err);
    });
};

let zip = archiver('zip').on('error', error => {
    console.log(error);
});

module.exports.createZipFromBlobs = (res, blobContainer, blobPrefix, blobParallelRequest = 100) => {
    container = blobContainer;
    prefix = blobPrefix;
    parallelrequest = blobParallelRequest;
    zip.pipe(res);
    listAndDownloadBlobs().then(() => {
        zip.finalize();
        console.log(`total ${blobCount} files downloaded`);
    });
};
