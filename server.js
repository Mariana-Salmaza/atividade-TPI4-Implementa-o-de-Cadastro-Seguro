const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

app.use(cors());

const createUploadDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório ${dir} criado com sucesso.`);
  }
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos JPEG e PNG são permitidos"), false);
  }
};

const max_file_size = 5 * 1024 * 1024;

app.get("/", (req, res) => {
  res.send("Servidor de upload funcionando");
});

const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    const uploadDirectory = "uploads/";
    createUploadDirectory(uploadDirectory);
    cd(null, uploadDirectory);
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: max_file_size,
    files: 10,
  },
});

app.post("/upload", (req, res) => {
  upload.fields([{ name: "meusArquivos", maxCount: 10 }])(
    req,
    res,
    function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          erro: `Erro do Multer: ${err.code}`,
          detalhes: "Verifique o tamanho e a quantidade de arquivos.",
        });
      }
      if (err) {
        return res.status(400).json({ erro: err.message });
      }
      if (!req.files || !req.files.meusArquivos) {
        return res.status(400).json({ erro: "Nenhum arquivo foi enviado" });
      }
      const arquivos = req.files.meusArquivos.map((file) => file.filename);
      res.status(200).json({
        mensagem: `Arquivos enviados com sucesso: ${arquivos.join(", ")}`,
        arquivos,
      });
      console.log(arquivos);
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor está rodando na porta: ${port}`);
});
