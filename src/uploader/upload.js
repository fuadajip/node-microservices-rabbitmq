const express = require("express");
const fileUpload = require("express-fileupload");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");

const PORT = 3050;

const app = express();
app.use(fileUpload());

app.get("/", (req, res) => {
  res.status(200).json({ service: "upload" });
});

app.post("/upload", (req, res) => {
  let img = req.files.image;
  imagemin
    .buffer(img.data, {
      plugins: [imageminPngquant()]
    })
    .then(out => {
      res.write(out, "binary");
      res.end(null, "binary");
    });
});

app.listen(PORT, () => console.log(`> Ready on port:${PORT}`));
