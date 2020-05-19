'use strict'

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const textract = require('textract');

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

let fileCount = 0, filesProcessed = 0, nonPDFs = [], errors = [];

const queue = [];
const outputPath = 'results.csv';
const rootPath = '/home/taskhero/Downloads/pdf-drive';

/**
 * @param {string} parentPath
 * @param {function(string)} execute
 */
// TODO: add starting point
function walk(parentPath, execute) {
  if (fileCount > 1000) return;

  fs.readdir(parentPath, (error, dir) => {
      if (error) {
        errors.push({parentPath, error});
        return false;
      }

      fileCount = fileCount + dir.length;
      logProcess();


      dir.forEach((child) => {

        const childPath = path.resolve(parentPath, child);

        fs.stat(childPath, (error, stats) => {
          if (error) {
            errors.push({childPath, error});
            return false;
          }


          if (stats.isDirectory()) {
            filesProcessed++;
            walk(childPath, execute);
          } else {
            execute(childPath);
          }
        });
      });
    }
  );
}

/**
 * @param {string} filePath
 */
function extractEmail(filePath) {
  if (path.extname(filePath) === '.pdf') {
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        errors.push({filePath, error});
        return false;
      }

      pdf(buffer)
        .then((data) => {
          let emailsString = '';
          const emails = data.text.match(emailRegex);

          if (emails !== null) {
            emails.forEach((email) => {
              emailsString += email + '\r\n';
            });
            queue.push(
              () => {
                try {
                  fs.appendFileSync(outputPath, emailsString);
                  filesProcessed++;
                } catch (appendError) {
                  console.log('Error while trying to save emails to csv: ' + appendError);
                }
              });
          } else {
            filesProcessed++;
          }
        })
        .catch((pdfError) => {
          errors.push({filePath, pdfError});
        });
    });

  } else {
    nonPDFs.push(filePath);
    filesProcessed++;
  }
}

function handleQueue() {

  while (queue.length) {
    //Get first function
    const first = queue.shift();

    //Execute first function
    first();

    logProcess();
  }

}

function logProcess() {
  console.log(`Files processed: (${filesProcessed}/${fileCount})`);
  console.log(nonPDFs);
  console.log(errors);
}

walk(rootPath, extractEmail);

setTimeout(handleQueue, 10000)

// * Starting point

// Save emails
// * print to csv
