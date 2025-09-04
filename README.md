# Devils Advocate AI - Frontend

This is the frontend for the Devils Advocate AI application, a web-based tool that simulates debates between two AI-powered characters on any given topic. It features multiple debate modes, real-time message generation, and text-to-speech audio for an engaging user experience.

## ✨ Features

- **Multiple Debate Modes**:
  - **Versus**: Two distinct AI characters debate each other.
  - **Devil's Advocate**: One AI takes a contrary position to the user's input.
  - **Solo**: A single AI character explores a topic.
- **Customizable Debates**: Users can define the two debating characters and the topic of discussion.
- **Real-time Interaction**: Watch the debate unfold message by message.
- **Text-to-Speech**: Generate and play audio for each message in the debate.
- **Session History**: The sidebar automatically loads and displays a history of past debates for the logged-in user.
- **User Authentication**: A simple username-based login system to persist session history.

## 🛠️ Tech Stack

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: For static typing, improving code quality and maintainability.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Vite**: The frontend tooling for a fast development experience.

##  Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [yarn](https://yarnpkg.com/)

This frontend requires the backend server to be running to function correctly. Please ensure the backend is running on `http://localhost:8000`.

## 🚀 Getting Started

Follow these steps to get the frontend development server running on your local machine.

### 1. Clone the Repository

If you haven't already, clone the project to your local machine.

### 2. Navigate to the Frontend Directory

```sh
cd path/to/DebateAi/frontend
```

### 3. Install Dependencies

Install all the required npm packages.

```sh
npm install
```

### 4. Run the Development Server

Start the Vite development server.

```sh
npm run dev
```

The application should now be running and accessible at `http://localhost:5173` (or another port if 5173 is in use).

## 📂 Project Structure

The main source code is located in the `src/` directory, organized as follows:

```
src/
├── components/   # Reusable UI components (Sidebar, ChatWindow, etc.)
├── context/      # React Context for global state (e.g., AuthContext)
├── hooks/        # Custom React hooks (e.g., useDebate)
├── pages/        # Top-level page components (LandingPage, DebatePage)
├── App.tsx       # Main application component with routing
└── main.tsx      # Entry point of the application
```