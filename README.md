# ~~Backend Project~~

- _The frontend development is planned in the near future_

- _Project name will be displayed after hosting_

This repository contains the journey of my backend development which includes the features like that of a YouTube, built with **Node.js** and **MongoDB**. The backend is designed to be functioanl similar to YouTube, including user management, video handling, subscriptions and tracking views and watch history.

## Features

- **User Authentication**: Register, Log in and manage user accounts securely using cookies and tokens.
- **Video Management**: Manages to upload, view (based on filters) and delete videos by the user.
- **Subscription System**: Users can subscribe to channels of which they likes the videos or posts.
- **Engagement**: Increases the engagement of user in videos using comments, like/unlike and community posts (pulses).
- **Handling Errors and Responses**: Robustly handles the Errors and Responses using classes and constructors.

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web framework for building REST APIs.
- **JWT**: Token-based authentication for user sessions.
- **MongoDB**: Database for storing different models data like users, videos, subscriptions likes, comments, likes and pulses.s
- **Mongoose**: NoSQL DB for MongoDB used to structure data models and enable aggregation pipelines.

## Installation

1. **Clone the repository**:

   ```bash
   git clone "https://github.com/DevloperMM/Stream-MP4.git" ./
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
