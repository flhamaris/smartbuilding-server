var express = require("express")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")
const utils = require("../utils/utils")

var router = express.Router()

// Set up multer to store the uploaded video in memory
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

/**
 * POST route handler for uploading a video.
 * The video is expected to be sent as a file in a multipart/form-data request.
 * The request should also include a 'label' and 'sequenceName' field in the body.
 * The video is sliced into frames, which are saved as PNG images in a directory structure based on the label and a sequence number.
 * If the video is sliced successfully, the function sends a 200 response with a success message.
 * If an error occurs while slicing the video, the function sends a 500 response with an error message.
 * If no file is uploaded or no label or sequenceName is provided, the function sends a 400 response with an error message.
 *
 * @param {object} req - The Express request object. Expected to contain a 'file' field with the uploaded video and a 'label' and 'sequenceName' field in the body.
 * @param {object} res - The Express response object. Used to send the response back to the client.
 */
router.post("/", upload.single("video"), async (req, res) => {
  // Check if a file, a label, and a sequenceName were provided. If not, send a 400 response with an error message.
  if (!req.file) {
    res.status(400).send({ message: "No file uploaded" })
    return
  }
  if (!req.body.label) {
    res.status(400).send({ message: "No label provided" })
    return
  }
  if (!req.body.sequenceName) {
    res.status(400).send({ message: "No sequence name provided" })
    return
  }

  // Get the video buffer, label, and sequenceName from the request
  const videoBuffer = req.file.buffer
  const label = req.body.label
  const sequenceName = req.body.sequenceName

  // Slice the video into frames and send a response based on whether the slicing was successful
  try {
    await utils.sliceVideo(videoBuffer, label, sequenceName)
    res.status(200).send({ message: "File uploaded successfully" })
  } catch (err) {
    res.status(500).send({
      message: "An error occurred while slicing the video: " + err.message,
    })
  }
})

module.exports = router
