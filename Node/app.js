const https = require('https');
const fs = require('fs');
const path = require('path');

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

main();
