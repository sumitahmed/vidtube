# VidTube - A Full-Stack YouTube Clone

VidTube is a complete video streaming platform built from the ground up, featuring a robust Node.js backend and a dynamic, responsive frontend created with vanilla JavaScript. This project demonstrates a full development lifecycle, from database design to deployment.

https://github.com/sumitahmed/vidtube/blob/main/vidtube-showcase.png.png
https://github.com/sumitahmed/vidtube/blob/main/Screenshot%202025-10-28%20225841.png

## Core Features

- **Full User Authentication**: Secure user registration and login using JWT (JSON Web Tokens) with access and refresh tokens.
- **Video Upload & Management**: Seamless video and thumbnail uploads to a cloud-based storage service (Cloudinary).
- **Channel & Profile Management**: Users have their own channels, can update their profile information, avatar, and cover images.
- **Video Discovery & Playback**: A responsive grid layout for browsing videos, leading to a dedicated video player page.
- **Subscription System**: Users can subscribe to and unsubscribe from other channels.
- **Like & Comment System**: Functionality to like videos and view comments.
- **Playlist Management**: Users can create, update, and delete playlists, adding or removing videos as they wish.
- **User Dashboard**: An analytics page showing channel stats like total video views, total subscribers, and total likes.
- **Watch History**: Automatically tracks videos watched by a logged-in user.

## Tech Stack

| Category           | Technology                                        |
| ------------------ | ------------------------------------------------- |
| **Backend**        | Node.js, Express.js                               |
| **Database**       | MongoDB with Mongoose (including Aggregation Pipelines) |
| **Authentication**   | JWT (Access/Refresh Tokens), bcrypt               |
| **File Handling**    | Cloudinary (Cloud Storage), Multer (Middleware)     |
| **Frontend**       | Vanilla JavaScript (ES6+), HTML5, CSS3            |
| **Deployment**     | **Backend:** Render, **Frontend:** Vercel             |

## Local Setup

To get this project running on your local machine, follow these steps.

### Prerequisites

- Node.js (v18.x or later recommended)
- A MongoDB instance (local or via MongoDB Atlas)
- A Cloudinary account for media storage

### Installation

1.  **Clone the repository:**
    ```
    git clone https://github.com/your-username/vidtube.git
    cd vidtube
    ```

2.  **Install backend dependencies:**
    ```
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following variables (refer to `.env.example`):
    ```
    PORT=8000
    MONGODB_URI=your_mongodb_connection_string
    CORS_ORIGIN=*
    ACCESS_TOKEN_SECRET=your-access-token-secret
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your-refresh-token-secret
    REFRESH_TOKEN_EXPIRY=10d
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    ```

4.  **Start the backend server:**
    ```
    npm run dev
    ```
    The server will start on `http://localhost:8000`.

5.  **Run the frontend:**
    Use a live server extension (like the one in VS Code) to serve the `frontend` directory, or simply open the `frontend/index.html` file in your browser.

## API Endpoints

The project exposes a RESTful API for all its functionalities. Key endpoints include:

-   `POST /api/v1/users/register` - User registration.
-   `POST /api/v1/users/login` - User login.
-   `GET /api/v1/videos` - Fetch all published videos.
-   `POST /api/v1/videos` - Upload a new video.
-   `GET /api/v1/videos/:videoId` - Get details for a specific video.
-   `POST /api/v1/subscriptions/c/:channelId` - Subscribe/unsubscribe from a channel.
-   `GET /api/v1/dashboard/stats` - Fetch stats for the user's dashboard.

...and many more for handling likes, comments, playlists, and user profiles.

