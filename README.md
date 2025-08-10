# TherapyAI - Multi-Container App

This project is structured as a modern web application with separate frontend and backend services, orchestrated using Docker Compose for easy development and deployment.

## Project Structure

TherapyAI/
<br>
├── docker/                  # Docker configuration files for containerized deployment <br>
├── node_modules/            # Installed Node.js dependencies (auto-generated) <br>
├── public/                  # Public assets served by the frontend (HTML, images, etc.) <br>
├── recordings/              # Stored audio recordings of therapy sessions <br>
├── src/                     # Main source code for the application (frontend & backend)<br>
├── .env                     # Environment variables configuration (API keys, DB settings) <br>
├── .gitignore               # Files and folders to be ignored by Git <br>
├── .Rhistory                # R console history file (if R was used for data analysis) <br>
├── docker-compose.yml       # Orchestration file for running multi-container Docker apps <br>
├── Dockerfile               # Instructions for building the Docker image <br>
├── login.txt                 # Text file possibly containing login info or credentials (secure this file) <br>
├── nginx.conf               # Nginx server configuration <br>
├── package-lock.json        # Auto-generated lockfile for Node.js dependencies <br>
├── package.json             # Node.js project metadata and dependency list <br>
├── README.md                # Project documentation and usage instructions <br>
├── requirements.txt         # Python dependencies for the backend <br>


## Docker & Docker Compose

### Running the App

In order to run the app, do the following steps:<br>
Step 1: Open a folder (that you want it to contain the code) with code editor. In terminal:<br>
git clone https://github.com/Matan2302/TherapyAI.git<br>
git clone --origin origin --branch main --recursive https://github.com/Matan2302/TherapyAI.git <br>
cd TherapyAI<br>
git fetch --all<br>

Step 2: Copy and paste .env file given in submission ZIP into the project's root.<br>
Step 3: Open Docker-Desktop app on your computer.<br>
Step 4: In your IDE's terminal, write:<br>
docker-compose up --build<br>
Step 5: In your browser, enter to "localhost". Use admin1@gmail.com;adminPASS123 to access admin user.<br>

** For more detailed information regarding installation, you may use Technical Guide in submission ZIP.