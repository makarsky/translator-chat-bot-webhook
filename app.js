const express = require("express");
const app = express();
const router = express.Router();

const api = require('./api');

const path = __dirname + '/views/';

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});

router.get("/",function(req,res){
  res.sendFile(path + "index.html");
});

router.get("/sharks",function(req,res){
  res.sendFile(path + "sharks.html");
});

app.use(express.static(path));
app.use('/', router);

app.use('/api/v1', api);

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
})
