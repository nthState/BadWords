const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

function checkFile(src, file, words) {
    try {
    
    
        core.info(`Reading: ${file}, src: ${src}`)
        
        const data = fs.readFileSync(path.resolve(`${file}`), 'utf8');

        const lines = data.split('\n')

        var lineNumber = 1;
        for (let line of lines) {
            const tokens = new Set(line.split(' '))
            let intersection = new Set([...tokens].filter(x => words.has(x)));
            if (intersection.size > 0) {
            
                core.info(`${file} contains ${Array.from(intersection.values())} at line: ${lineNumber}`)
                
                return file
            }
            lineNumber++;
        }

        
    } catch (err) {
        core.info(`Error...${err}`)
    }
    
    return undefined
}

async function main() {
    try {
        const src = core.getInput('src');
        const words = new Set((core.getInput('words') || '').split(',').map(t => t.trim()));
        const fileTypeFilter = (core.getInput('fileTypeFilter') || '').split(',').map(t => t.trim());

        core.info('Starting...')
        core.info(`fileTypeFilter: ${fileTypeFilter}`)
        
        //const filesList = fs.readdirSync(src, (err, files) => files.filter((e) => path.extname(e).toLowerCase() === fileTypeFilter));
        //const filesList = getAllFiles(src).filter(file => file.endsWith(fileTypeFilter));
        const filesList = getAllFiles(src)
        core.info(`filesList: ${filesList}`)
        
        const filtered = filesList.filter(file => {
            return fileTypeFilter.some(element => {
             return file.endsWith(element) 
             });
            });
        core.info(`filtered: ${filtered}`)
 
        const output = filtered.map(file => checkFile(src, file, words)).filter(n => n);

        core.setOutput("files", output);
        
        if (output.length > 0) {
            return core.setFailed(`Files contain bad words: ${output}`)
        }

    } catch (error) {
      core.setFailed(error.message);
    }
}

main()