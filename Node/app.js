const https = require('https');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk')



// Server setuo
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Data Engineer Kimaiyo!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
// API endpoint
const apiUrl = 'https://search.worldbank.org/api/v3/wds?format=json&qterm=wind%20turbine&fl=docdt,count';

// Function to fetch data from the API
function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            // Collect data chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // End event when the response is complete
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (error) {
                    reject(`Error parsing JSON: ${error.message}`);
                }
            });
        }).on('error', (err) => {
            reject(`Error fetching data: ${err.message}`);
        });
    });
}

// Function to write data to a JSON file
function writeToFile(filename, data) {
    fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(`Error writing to file: ${err.message}`);
        } else {
            console.log(`Data successfully written to ${filename}`);
        }
    });
}

// Main function to fetch and save data
async function main() {
    try {
        console.log('Fetching data from API...');
        const data = await fetchData(apiUrl);
        console.log('Data fetched successfully. Writing to file...');

        const outputDir = path.join(__dirname, 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const outputFilename = path.join(outputDir, 'us_population_data.json');
        writeToFile(outputFilename, data);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}


// load date to s3 backet
const s3 = new AWS.S3();
const bucketName = 'usa-population-macroafrikpress-uploads'
const newFileNameKey =  'us_population_data.json'
const filePath = './data/us_pupolation_data.json'

function uploadFile(filePath, bucketName, newFileNameKey){
const fileStream = fs.createReadStream(filePath);
fileStream.on(event 'error', listener:(err)=>{
    console.log('file error',err)
})

const params = {
    Bucket:bucketName,
    Key:newFileNameKey,
    Body:fileStream
};

s3.upload(params, options:(err,data) =>{
if(err){
    console.group('Error',err)
}
if(data){
   console.log('Sucess',data.location)
}
})
}
uploadFile(filePath, bucketName, newFileNameKey)

main();
