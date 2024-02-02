const ffmpeg = require("fluent-ffmpeg")
const path = require("path")
const fs = require("fs")
const { Readable } = require("stream")
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path

ffmpeg.setFfmpegPath(ffmpegPath)

/**
 * The `sliceVideo` function takes a video buffer and an output directory, converts the video into frames,
 * and saves the frames as PNG images in the specified directory.
 * The function returns a Promise that resolves when the video processing is finished and rejects if an error occurs.
 *
 * @param {Buffer} videoBuffer - A Buffer containing the video data. This must be a Buffer, or the function will reject the Promise with an error.
 * @param {string} outputDirectory - A string representing the output directory where the frames are saved.
 * This must be a string, or the function will reject the Promise with an error.
 *
 * @returns {Promise} - A Promise that resolves when the video processing is finished and rejects if an error occurs.
 */
const sliceVideo = (videoBuffer, outputDirectory) => {
  fs.writeFileSync(path.join(outputDirectory, "input.webm"), videoBuffer)
  return new Promise((resolve, reject) => {
    // Check if the videoBuffer is an instance of Buffer and if the subjectId is a string. If not, reject the Promise with an error.
    if (
      !(videoBuffer instanceof Buffer) ||
      typeof outputDirectory !== "string"
    ) {
      reject(
        new Error(
          "videoBuffer must be a Buffer and outputDirectory must be a string"
        )
      )
    }

    // Create a Readable stream from the videoBuffer
    const videoStream = new Readable()
    videoStream.push(videoBuffer)
    videoStream.push(null)

    // Use ffmpeg to process the video stream. Set the input format to "webm", set the output options to use the libx264 codec,
    // a constant rate factor of 20, and a frame rate of 20 frames per second.
    ffmpeg()
      .input(videoStream)
      .inputFormat("webm")
      .outputOptions(["-vf fps=20"])
      .on("error", (err) => {
        console.error("ffmpeg error:", err)
        // If an error occurs during processing, reject the Promise.
        reject(err)
      })
      .on("end", () => {
        // When processing is finished, resolve the Promise.
        resolve()
      })
      .save(`${outputDirectory}image%d.png`)
  })
}

/**
 * The `getSequenceNumber` function takes an output directory and returns the next sequence number based on the existing sequences in the directory.
 * The function scans the directory for files that start with "sequence", extracts the sequence numbers from the file names, and returns the highest sequence number plus one.
 *
 * @param {string} outputDirectory - A string representing the output directory where the sequences are saved.
 * This must be a string, or the function will throw an error.
 *
 * @returns {number} - The next sequence number.
 */
const getSequenceNumber = (outputDirectory) => {
  const existingSequences = fs
    .readdirSync(outputDirectory)
    .filter((file) => file.startsWith("sequence"))
  let highestSequenceNumber = 0
  if (existingSequences.length > 0) {
    highestSequenceNumber = existingSequences.reduce((max, sequence) => {
      const sequenceNumber = parseInt(sequence.replace("sequence", ""), 10)
      return sequenceNumber > max ? sequenceNumber : max
    }, 0)
  }
  return highestSequenceNumber + 1
}

module.exports = {
  sliceVideo,
  getSequenceNumber,
}
