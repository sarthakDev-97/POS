const { uploadFile, getFile } = require("../controllers/fileHandling/upload");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const multer = require("fastify-multer");
const fs = require("fs");
const csvFile = require("../controllers/productsControllers/ProductPart/csvProductAdd");
const {
  productComponents,
} = require("../controllers/productsControllers/ProductPart/addCSVController");
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadURL = await req.url.split("/").reverse()[0];
    const uploadPath = path.join(
      __dirname,
      `../public/${uploadURL === "import" ? "csv" : "images"}`
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  },
});

const upload = multer({ storage });

const uploadFunc = (fastify, _, done) => {
  fastify.post("/", { preHandler: upload.array("files", 10) }, uploadFile);

  fastify.get("/", {}, getFile);

  fastify.post(
    "/import",
    {
      preHandler: [
        // (req, res) => authMiddleware(req, res),
        upload.array("file", 1),
        (req, res) => csvFile(req, res),
      ],
    },
    productComponents
  );

  fastify.get("/import", {}, getFile);

  done();
};

module.exports = { uploadFunc, multer };
