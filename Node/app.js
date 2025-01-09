const https = require('https');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const { parse } = require('json2csv'); // Library to convert JSON to CSV

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Data Engineer Kimaiyo!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const apiUrl = 'https://search.worldbank.org/api/v3/wds?format=json&qterm=wind%20turbine&fl=docdt,count';

// Function to fetch data from the API
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

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
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(`Error writing to file: ${err.message}`);
      } else {
        console.log(`Data successfully written to ${filename}`);
        resolve();
      }
    });
  });
}

// Function to write data to a CSV file
function writeToCSV(filename, data) {
  return new Promise((resolve, reject) => {
    try {
      const csv = parse(data); // Convert JSON to CSV
      fs.writeFile(filename, csv, (err) => {
        if (err) {
          reject(`Error writing CSV to file: ${err.message}`);
        } else {
          console.log(`CSV successfully written to ${filename}`);
          resolve();
        }
      });
    } catch (error) {
      reject(`Error converting JSON to CSV: ${error.message}`);
    }
  });
}

// Function to upload data to S3
async function uploadToS3(bucketName, key, filePath) {
  const s3Client = new S3Client({ region: 'us-east-1' }); // Specify your region
  const fileData = fs.readFileSync(filePath);

  try {
    console.log('Uploading data to S3...');
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileData,
      })
    );
    console.log(`Data successfully uploaded to S3 bucket ${bucketName} with key ${key}`);
  } catch (error) {
    console.error(`Error uploading to S3: ${error.message}`);
  }
}

// Main function to fetch, save, and upload data
async function main() {
  try {
    console.log('Fetching data from API...');
    const data = await fetchData(apiUrl);
    console.log('Data fetched successfully. Writing to files...');

    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Write JSON file
    const jsonFilename = path.join(outputDir, 'us_population_data.json');
    await writeToFile(jsonFilename, data);

    // Write CSV file
    const csvFilename = path.join(outputDir, 'us_population_data.csv');
    await writeToCSV(csvFilename, data);

    // Upload JSON to S3
    const bucketName = 'usa-population-macroafrikpress-uploads';
    const jsonKey = 'us_population_data.json';
    await uploadToS3(bucketName, jsonKey, jsonFilename);

    // Upload CSV to S3
    const csvKey = 'us_population_data.csv';
    await uploadToS3(bucketName, csvKey, csvFilename);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

main();
