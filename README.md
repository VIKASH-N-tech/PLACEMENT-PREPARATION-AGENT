# AI-Powered Placement Preparation Agent

## Project Overview

The Placement Preparation Agent is an AI-powered web application designed to help students prepare for campus placements and technical interviews. It provides personalized aptitude practice, AI-based resume analysis, mock interviews, coding questions, and performance tracking to improve students' placement readiness.

## Features

* **Aptitude Practice:** Practice aptitude questions at Easy, Medium, and Hard levels.
* **AI-Powered Interview Preparation:** Generate technical and HR interview questions with AI-based feedback.
* **Resume Analysis:** Upload a resume, identify areas for improvement, and receive suggestions to improve its quality.
* **Mock Interview:** Simulate interviews with a countdown timer and optional microphone support.
* **Coding Practice:** Practice programming questions and review solutions.
* **Performance Dashboard:** Track practice results, progress, and daily learning streaks.
* **Personalized Learning:** Receive preparation recommendations based on performance.
* **AI Integration:** Use Gemini or Groq APIs to generate relevant questions, feedback, and learning suggestions.

## Technology Stack

* **Frontend:** HTML, CSS, JavaScript / React
* **Backend:** Python, FastAPI
* **AI Services:** Google Gemini API / Groq API
* **Database:** MongoDB / ChromaDB, depending on implementation
* **Document Processing:** PyPDF or another supported PDF library
* **Tools:** Visual Studio Code, Git, GitHub

## Project Structure

```text
Placement-Preparation-Agent/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py
│   │   ├── aptitude.py
│   │   ├── interview.py
│   │   ├── resume.py
│   │   ├── coding.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── groq_service.py
│   │   └── prompt_engineering.py
│   ├── models/
│   └── uploads/
├── frontend/
│   ├── public/
│   └── src/
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

*Adjust this structure to match your actual project.*

## Prerequisites

Install the following software:

* Python 3.10 or later
* Git
* Visual Studio Code
* Node.js and npm, if using React
* MongoDB, if required by your implementation
* An API key for the AI provider you use

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/Placement-Preparation-Agent.git
cd Placement-Preparation-Agent
```

Replace `YOUR-USERNAME` with your GitHub username.

### Step 2: Create a Virtual Environment

Navigate to the backend directory:

```bash
cd backend
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

On Linux or macOS:

```bash
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Ensure the requirements file contains the dependencies used by your implementation, such as FastAPI, Uvicorn, the selected AI SDK, PDF-processing libraries, and database clients.

### Step 4: Configure Environment Variables

Create a `.env` file using `.env.example` as a template.

Example:

```text
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_database_connection
```

Configure only the variables required by your application. Obtain API keys from the relevant provider and never upload your `.env` file or expose API keys in frontend code.

### Step 5: Start the Backend

If `app.py` contains a FastAPI application instance named `app`, run:

```bash
uvicorn app:app --reload
```

If your application uses a different entry point, update the command accordingly.

The API will generally be available at:

* Backend: `http://127.0.0.1:8000`
* Swagger UI: `http://127.0.0.1:8000/docs`

### Step 6: Start the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by the frontend development server.

For a plain HTML, CSS, and JavaScript frontend, use your configured local web server instead.

### Step 7: Configure the Database

Start and configure the database used by your project. Add the connection details to the backend environment variables and initialize the required collections or tables.

If the project uses ChromaDB for vector search, configure its persistence directory and initialize the collection required by the application.

### Step 8: Verify AI Integration

Confirm that the configured AI provider can generate responses successfully.

Test the following features:

* Generate aptitude questions at different difficulty levels.
* Generate technical and HR interview questions.
* Review an uploaded resume.
* Generate feedback for mock interview answers.
* Handle API errors, rate limits, and invalid credentials gracefully.

## Main Modules

| Module                | Description                                           |
| --------------------- | ----------------------------------------------------- |
| Aptitude Practice     | Generates questions and evaluates answers             |
| Interview Preparation | Provides technical and HR interview practice          |
| Resume Review         | Analyzes resumes and suggests improvements            |
| Mock Interview        | Simulates an interview session with a timer           |
| Coding Practice       | Provides programming questions and feedback           |
| Dashboard             | Displays performance, progress, and learning streaks  |
| AI Services           | Integrates language models into preparation workflows |

## Running Tests

Run the backend tests from the appropriate project directory:

```bash
pytest
```

Test API endpoints, AI service error handling, resume uploads, aptitude scoring, and dashboard functionality.

## Troubleshooting

**Python or pip is not recognized:** Install Python, enable PATH during installation, and reopen the terminal.

**ModuleNotFoundError:** Activate the virtual environment and install the required packages.

**AI API authentication error:** Verify the API key, environment variable names, provider configuration, and API access.

**Frontend connection error:** Confirm that the backend is running and that the frontend uses the correct API URL.

**Database connection error:** Check database availability, connection settings, and permissions.

## Learning Outcomes

* AI application development and prompt engineering.
* REST API development using FastAPI.
* Frontend and backend integration.
* Resume parsing and feedback generation.
* AI-assisted interview preparation.
* Database and vector search integration.
* Automated testing and version control.

## Future Enhancements

* Speech-to-text and voice-based mock interviews.
* Resume-to-job-description matching.
* Personalized study plans and reminders.
* Advanced coding evaluation and test cases.
* Placement analytics and company-specific preparation.
* Cloud deployment using AWS or Azure.

## Author

**Your Name**

GitHub: https://github.com/YOUR-USERNAME

## License

Choose an appropriate open-source license and add a `LICENSE` file if you intend to distribute the project publicly.
