# Project

- Will name project after hosting, just for some uniqueness

This repository contains the journey of my backend development which includes the features like that of a YouTube, built with **Node.js** and **MongoDB**. The backend is designed to provide core functionalities similar to YouTube, including user management, video handling, subscriptions, and watch history tracking. The frontend is planned for future development.

## Features

- **User Authentication**: Register, Log in, and manage user accounts securely using tokens.
- **Video Management**: Uploading, viewing (based on filters) and deleting with tracking of views on videos.
- **Subscription System**: Users can subscribe to channels to receive updates.
- **Querying Database**: Use of aggregation pipelines to fetch data from the database.
- **Watch History**: Tracks and stores a user’s video watch history.
- **Handling Errors and Responses**: Robustly handles the Errors and Responses using classes and constructors.

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web framework for building REST APIs.
- **MongoDB**: Database for storing user, video, and subscription data.
- **Mongoose**: NoSQL DB for MongoDB used to structure data models.
- **JWT**: Token-based authentication for user sessions.

## Installation

1. **Clone the repository**:

   ```bash
   git clone "https://github.com/DevloperMM/Core-Dev.git"

   cd Core-Dev
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Variables**: Create a .env file with

   ```plaintext
    PORT=
    DB_NAME=
    MONGODB_URL=

    CORS_ORIGIN=

    ACCESS_TOKEN_SECRET=
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=
    REFRESH_TOKEN_EXPIRY=10d

    CLOUD_NAME=
    CLOUD_API_KEY=
    CLOUD_API_SECRET=
    PROJECT=

   ```

4. **Run the server**:

   ```bash
   npm run dev
   ```

The server will be live at `https://localhost:[PORT]`

## Future Development

- **Frontend Integration**: React.js or any other suitable framework will be used for frontend.
- **Recommendations**: Personalized video recommendations based on user activity.
- **Real-time Notifications**: Notify users of new uploads from subscribed channels.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you would like to improve the project.

---

### _Thank You_

**_With Regards_**  
_Mangal Murti Varshney_
