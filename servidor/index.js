// JWT
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
var { expressjwt: expressJWT } = require("express-jwt");
const cors = require("cors");
const cripto = require('./services/cripto')
const transporter = require('./services/mailer')



var cookieParser = require("cookie-parser");

const express = require("express");
const { usuario } = require("./models");

const app = express();
var isLogged = false;
var nome = "";
var dataAtual = new Date();

app.set("view engine", "ejs");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cookieParser());
app.use(
  expressJWT({
    secret: process.env.SECRET,
    algorithms: ["HS256"],
    getToken: (req) => req.cookies.token,
  }).unless({
    path: ["/", "/admin", "/autenticar", "/logar", "/deslogar", "/sobre"],
  })
);




//ROUTES

app.get("/", async function (req, res) {

  if (isLogged) {
    res.render("home", { nome });
  } else {
    res.render("loggedFalse");
  }
});

app.get("/autenticar", async function (req, res) {
  res.render("autenticar");
});

app.get("/sobre", async function (req, res) {
  res.render("sobre");
});

app.get("/usuarios", async function (req, res) {
  const retorna = await usuario.findAll();
  res.render("usuarios", { retorna });
});

app.get("/usuarios/:id", async function (req, res) {
  var resultado = await usuario.findByPk(req.params.id);

  res.render("retornaUsuario", { resultado });
});

app.get("/cadastrar", async function (req, res) {
  res.render("cadastrar");
});

app.post("/cadastrar", async function (req, res) {
 
const inserir = {
  usuario: req.body.usuario,
  nome: req.body.nome,
  senha: cripto.encrypt(req.body.senha)
}

  const retorna = await usuario.create(inserir);
  res.render("novoUsuario", { retorna });
});

app.get("/logar", async function (req, res) {
  res.render("logar", { nome });
});

app.post("/logar", async function (req, res) {
  const verificaUsuario = await usuario.findOne({
    where: { usuario: req.body.usuario },
  });

  if (verificaUsuario != null) {
    if (
      req.body.usuario == verificaUsuario.usuario &&
      req.body.senha == cripto.decrypt(verificaUsuario.senha)
    ) {
      const id = 1;
      const token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 3600, // expires in 1 hour
      });

      res.cookie("token", token, { httpOnly: true });
      isLogged = true;
      nome = verificaUsuario.nome;

      transporter.sendMail({

        from: "iMail Mailer <iMail@irddesign.com>",
        to: "iguivinigamer@gmail.com",
        subject: "Novo Login Detectado",
        html: `<h3>Olá! O usuário ${nome} acabou de realizar login na plataforma</h3>
        <br/>
        <p><strong>Data:</strong>${dataAtual.toLocaleString('pt-BR')}</p>
        
        
        `
        
        }).then(message =>{
        console.log(message)
        }).catch(err =>{
          console.log(err)
        })
        
      return res.render("logar", { nome });
    }

    res.status(500).json({ message: "Login inválido!" });
  } else {
    res.render("userError");
  }
});

app.post("/deslogar", function (req, res) {
  res.cookie("token", null, { httpOnly: true });
  res.render("deslogar");
  isLogged = false;
});

app.listen(3000, function () {
  console.log("App de Exemplo escutando na porta 3000!");
});
