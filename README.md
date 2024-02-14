# Smart Building Server

This is the server-side component of the Smart Building project. It's responsible for handling requests from the client-side application, processing video uploads, and interfacing with Azure Blob Storage.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- npm

### Installing

1. Clone the repository:

```sh
git clone https://github.com/flhamaris/smartbuilding-server.git
```

2. Navigate into the project directory:

```sh
cd smartbuilding-server
```

3. Install the dependencies:

```sh
npm install
```

### Running the Server

To start the server, run:

```
npm start
```

The server will start on port 3000, or the port specified in your .env file.

## Environment variables

The server requires the following environment variables:

- `AZURE_STORAGE_CONNECTION_STRING`: The connection string for your Azure Blob Storage Account
- `AZURE_STORAGE_CONTAINER_NAME`: The name of the Azure Blob Storage container to query to
- `FRAME_PER_SECOND_SUB_SAMPLING`: The subsampling value if needed for the video uploaded. Default is 20 fps.

These should be placed in a `.env` file in the root of your project. You can create your `.env` from the `.env.local` included.

Built With:

- [Express](https://expressjs.com/) - The web framework used
- [@azure/storage-blob](https://www.npmjs.com/package/@azure/storage-blob) - Azure Blob Storage client library for JavaScript
- [multer](https://www.npmjs.com/package/multer) - Middleware for handling multipart/form-data

## API Endpoints

### `POST /upload`

This endpoint is used to upload a video for processing. The video is expected to be sent as a file in a multipart/form-data request. The request should also include a 'label' and 'sequenceName' field in the body. The video is sliced into frames, which are saved as PNG images in a directory structure based on the label and a sequence number.

#### Request Parameters

- `video`: The video file to be uploaded. This should be included in the request as a file in a multipart/form-data format.
- `label`: A label for the video. This should be included in the body of the request.
- `sequenceName`: A name for the sequence. This should be included in the body of the request.

#### Response

- If the video is sliced successfully, the endpoint will send a 200 response with a success message.
- If an error occurs while slicing the video, the endpoint will send a 500 response with an error message.
- If no file is uploaded or no label or sequenceName is provided, the endpoint will send a 400 response with an error message.
