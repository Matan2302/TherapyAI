# TherapyAI - Multi-Container App

This project is structured as a modern web application with separate frontend and backend services, orchestrated using Docker Compose for easy development and deployment.

## Project Structure

- **/src/Backend/**: Python backend (API server)
- **Frontend (root directory)**: React frontend (bootstrapped with Create React App)
- **/docker/**: Contains service-specific Dockerfiles
- **docker-compose.yml**: Defines and runs multi-container Docker applications

## Docker & Docker Compose

### Running the App (Recommended)

To start both the backend and frontend using Docker Compose:

```sh
docker-compose up --build
```

- The backend will be available at [http://localhost:8000](http://localhost:8000)
- The frontend will be available at [http://localhost](http://localhost)

### Dockerfiles Explained
- **Dockerfile** (root): Legacy/general backend image, not used by default in Compose (see below).
- **docker/backend.Dockerfile**: Used by Compose to build the backend (Python API) container.
- **docker/frontend.Dockerfile**: Used by Compose to build the frontend (React + Nginx) container.

## Development Scripts (Frontend Only)

You can still use the standard Create React App scripts for local frontend development:

- `npm start`: Run the React frontend in development mode
- `npm test`: Launch the test runner
- `npm run build`: Build the frontend for production

## Environment Variables
- Backend: Configure in `.env` at the project root
- Frontend: Set `REACT_APP_API_URL` in Compose or as an environment variable

## Notes
- Use `docker-compose` for full-stack development and deployment.
- The backend and frontend are decoupled and can be developed independently.
- For custom setups, refer to the Dockerfiles and `docker-compose.yml` for build details.

---

For more detailed commands or troubleshooting, see the comments in each Dockerfile and the Compose file.
## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
"# TherapyAI" 
"# TherapyAI" 
"# TherapyAI" 
