const ffmpeg = require("fluent-ffmpeg")
const path = require("path")
const fs = require("fs")
const { Readable } = require("stream")
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
const { BlobServiceClient } = require("@azure/storage-blob")

// Retrieve Azure Storage connection string and container name from environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

// Create BlobServiceClient and ContainerClient for Azure Storage operations
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString)
const containerClient = blobServiceClient.getContainerClient(containerName)

// Initialize frame counter
let frameCounter = 0

// Set path for ffmpeg module
ffmpeg.setFfmpegPath(ffmpegPath)

/**
 * The `uploadFrame` function uploads a frame to Azure Blob Storage.
 * It creates a block blob client and uploads the frame stream to the blob storage.
 *
 * @param {Readable} frameStream - A Readable stream containing the frame data.
 * @param {string} label - A string representing the label for the frame.
 */
const uploadFrame = async (frameStream, label, sequenceName) => {
  // Generate sequence name
  // const sequenceName = await setSequenceName()

  // Construct blob name
  const blobName = `input_folder/${label}/${sequenceName}/viewA/image${++frameCounter}.png`

  // Create block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)

  console.log(`Uploading frame ${blobName} to blob storage`)

  // Upload frame stream to blob storage
  await blockBlobClient.uploadStream(frameStream)

  console.log(`Frame ${blobName} uploaded to blob storage`)
}

/**
 * The `sliceVideo` function takes a video buffer and a label, converts the video into frames,
 * and uploads the frames as PNG images to Azure Blob Storage.
 * The function returns a Promise that resolves when the video processing is finished and rejects if an error occurs.
 *
 * @param {Buffer} videoBuffer - A Buffer containing the video data. This must be a Buffer, or the function will reject the Promise with an error.
 * @param {string} label - A string representing the label for the frames. This must be a string, or the function will reject the Promise with an error.
 *
 * @returns {Promise} - A Promise that resolves when the video processing is finished and rejects if an error occurs.
 */
const sliceVideo = (videoBuffer, label, sequenceName) => {
  return new Promise((resolve, reject) => {
    // Check if the videoBuffer is an instance of Buffer and if the label is a string. If not, reject the Promise with an error.
    if (!(videoBuffer instanceof Buffer) || typeof label !== "string") {
      reject(
        new Error("videoBuffer must be a Buffer and label must be a string")
      )
    }

    // Create a Readable stream from the videoBuffer
    const videoStream = new Readable()
    videoStream.push(videoBuffer)
    videoStream.push(null)

    // Create an FFmpeg command to convert the video into frames
    const ffmpegCommand = ffmpeg()
      .input(videoStream)
      .inputFormat("webm")
      .outputOptions(["-vf fps=20"])
      .outputFormat("image2pipe")
      .on("end", () => {
        frameCounter = 0
        resolve()
      }) // Resolve the Promise when FFmpeg finishes processing
      .on("error", (err) => {
        console.error("ffmpeg error:", err)
        reject(err)
      })

    // Pipe the output of FFmpeg to the output stream
    const output = ffmpegCommand.pipe()
    let defaultSequenceName = new Date().toISOString()

    // For each chunk of data (frame) emitted by the output stream, create a new Readable stream and upload the frame to Azure Blob Storage
    output.on("data", (chunk) => {
      const frameStream = new Readable()
      frameStream.push(chunk)
      frameStream.push(null)
      uploadFrame(
        frameStream,
        label,
        sequenceName || defaultSequenceName
      ).catch((err) => {
        console.error("Error while uploading frame to blob storage:", err)
      })
    })
  })
}

/**
 * The `setSequenceName` function sets the video sequence name in Azure Blob Storage.
 * If a video sequence name is provided, it uses that name; otherwise, it generates a new name based on the current date and time.
 * The function returns a Promise that resolves when the video sequence name is set and rejects if an error occurs.
 *
 * @param {string} sequenceName - An optional string containing the video sequence name. If this parameter is not provided, a new video sequence name is generated based on the current date and time.
 *
 * @returns {Promise} - A Promise that resolves when the video sequence name is set and rejects if an error occurs.
 */
const setSequenceName = (sequenceName) => {
  return new Promise((resolve, reject) => {
    blobServiceClient.createBlockBlobFromText(
      containerName,
      sequenceName || new Date().toISOString(),
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

module.exports = {
  sliceVideo,
}
