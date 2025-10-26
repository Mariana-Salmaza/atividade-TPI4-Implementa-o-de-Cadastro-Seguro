const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const userModel = require("./model/userModel");
const hashPasswordAsync = require("./Bcrypt/hashPassword");

let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (err) {
  bcrypt = require("bcryptjs");
}

app.use(cors());
app.use(express.json());

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

app.post("/hash-teste", async (req, res) => {
  const senha = req.body && req.body.senha;
  const saltRounds = 10;

  if (!senha) {
    return res
      .status(400)
      .json({ error: 'Campo "senha" é obrigatório no corpo (JSON).' });
  }

  try {
    const hashSenha = await hashPasswordAsync(senha, saltRounds);
    res.status(200).json({ hash: hashSenha });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar hash", details: err.message });
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);
  if (userModel.findByUsername(username)) {
    return res.status(400).json({ error: "Usuario já existe." });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = userModel.addUser({ username, email, passwordHash });
  console.log(newUser);

  res.status(201).json({
    mensagem: "Usuário criado com sucesso.",
    user: { id: newUser.id, username: newUser.username },
  });
});

app.listen(port, () => {
  console.log(`Servidor está rodando na porta: ${port}`);
});
