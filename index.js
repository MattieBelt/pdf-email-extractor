'use strict'

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  header: ['email'],
  path: 'results.csv'
});

const betterQueue = require('better-queue');

let writeQueue = new betterQueue( (input, cb) => {
  console.log(input);
  saveEmail(input);

  cb(null, true);
})


/**
 * @param {string} parentPath
 * @param {function(string)} execute
 */
// TODO: add starting point
function walk(parentPath, execute) {

  const dir = fs.readdirSync(parentPath);

  let childPath = '';
  for (let i = 0; i < dir.length; i++) {
    childPath = path.resolve(parentPath, dir[i]);

    if (fs.statSync(childPath).isDirectory()) {
      walk(childPath, execute);
    } else {
      console.log('non-dir: ' + childPath);
      execute(childPath);
    }
  }
}

/**
 * @param {string} filePath
 */
function read(filePath) {
  if (path.extname(filePath)) {
    const dataBuffer = fs.readFileSync(filePath);

    pdf(dataBuffer).then((data) => {
      const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

      data.text.match(regex).forEach((email) => {
        console.log(email);

        writeQueue.push(email)
      });
    });
  } else {
    // TODO: handle non-pdfs
  }
}

function saveEmail(email) {
  csvWriter.writeRecords([{email}])
    .then(() => {
      console.log('...saved');
    });
}


const rootPath = './sources';

walk(rootPath, read);


// Loop through files
// * subfolder
// * Starting point





// Check if PDF
// * note NON-PDF's


// Parse PDF -> string


// Check string for emails
// * REGEX

// Save emails
// * print to csv
