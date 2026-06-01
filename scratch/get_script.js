const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\.system_generated\\logs\\transcript.jsonl';

async function extract() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.step_index === 482) {
        console.log("FOUND 482!");
        if (data.content) {
          fs.writeFileSync('C:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\scratch\\extracted_script.md', data.content);
          console.log("Written content to scratch/extracted_script.md");
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

extract();
