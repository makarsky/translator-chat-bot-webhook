const express = require("express");
const bodyParser = require('body-parser');

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

app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())

app.use(express.static(path));
app.use('/', router);
app.use('/api/v1', api);

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
})
