our Reusable Checklist for a New Node.js Backend Project
Follow these steps in order every time you start.

Step 1: Initialize Your Project
First, create a folder for your new project, go into it, and then initialize it with npm.

mkdir my-new-project

cd my-new-project


npm init -y 

Step 2: Set Your Project to Use ES Modules
Open the package.json file that was just created and add this line. This lets you use the modern 

import/export syntax.

JSON

"type": "module",
Step 3: Install Core Dependencies
These are the main packages your application will need to run.

Bash

npm install express mongoose dotenv winston morgan

express: For creating your server and API routes.


mongoose: To talk to your MongoDB database.

dotenv: To manage environment variables (like secret keys).


winston & morgan: For professional logging.

Step 4: Install Development Dependencies
These are tools that help you while you are coding.

Bash

npm install --save-dev nodemon prettier

nodemon: Automatically restarts your server when you save a file.


prettier: Keeps your code formatting clean and consistent.

Step 5: Create Your Folder Structure
This keeps your project organized. Create a src folder for all your source code.

mkdir src

cd src


mkdir controllers db middlewares models routes utils 

cd .. (to go back to the root folder)

Step 6: Create a .gitignore File
In the root folder, create a file named .gitignore. This tells Git which files to ignore. It's very important to keep secret files (.env) and large folders (node_modules) out of your repository.

# Node modules
node_modules

# Environment variables
.env
.env.*

# Build folder
/dist
Step 7: Configure Prettier
In the root folder, create a file named 

.prettierrc to set your formatting rules.

JSON

{
    "singleQuote": false,
    "bracketSpacing": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "semi": true
}
Step 8: Set Up npm Scripts
Open your package.json and replace the default "scripts" section with this. These are shortcuts to run your server.

JSON

"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js"
},

npm run start: Runs your app normally.


npm run dev: Runs your app with nodemon, so it auto-restarts on changes.

Step 9: Set Up the Logger (src/logger.js)
Inside your src folder, create a file named logger.js. Paste this code in. This is your reusable logger configuration.

JavaScript

import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, colorize, printf } = format;

const consoleLogFormat = format.combine(
    colorize(),
    printf(({ level, message }) => `${level}: ${message}`)
);

const logger = createLogger({
    level: 'info',
    format: combine(timestamp(), json()),
    transports: [
        new transports.Console({ format: consoleLogFormat }),
        new transports.File({ filename: 'app.log' })
    ],
});

export default logger;
Step 10: Create Your Basic Server (src/index.js)
Finally, create your main server file inside the src folder. This code creates a basic Express server and connects your logger.

JavaScript

import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import logger from './logger.js'; // [cite: 14]

const app = express()
const port = process.env.PORT || 3000

// --- Logger Integration --- [cite: 15]
app.use(morgan('tiny', {
    stream: {
        write: (message) => logger.info(message.trim()),
    },
}));

// --- Your Code Here ---
app.get('/', (req, res) => {
    res.send('Hello World!')
})


// --- Start the Server ---
app.listen(port, () => {
    logger.info(`Server is running on port: ${port}...`); // [cite: 18]
});
And that's it! Now you can run npm run dev and you will have a professional, well-structured, and production-ready starting point for your new backend application.