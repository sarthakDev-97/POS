const { StatusCodes } = require("http-status-codes");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

const resizeMiddleware = (fastify, _, done) => {
  fastify.get("/:filename", {}, async (request, reply) => {
    const { filename } = request.params;
    if (!filename) {
      return reply
        .code(StatusCodes.NOT_MODIFIED)
        .send({ msg: "No filename provided" });
    }

    let { s } = request.query;
    if (!s) {
      s = 1000;
    } else {
      s = parseInt(s);
    }

    try {
      const imagePath = path.join(__dirname, "../public/images", filename);
      if (!fs.existsSync(imagePath)) {
        return reply
          .code(StatusCodes.NOT_FOUND)
          .send({ msg: "File not found." });
      }
      const image = sharp(imagePath);
      const resizedImage = image.resize(s, s, {
        fit: "inside",
        withoutEnlargement: true,
      });

      reply.header("Content-Type", image.metadata().mimetype);
      await resizedImage.pipe(reply.raw);
      return reply.code(StatusCodes.OK);
    } catch (err) {
      console.error("Error resizing image:", err);
      reply
        .code(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ msg: "Error resizing image" });
    }
  });

  done();
};

module.exports = resizeMiddleware;
