const express = require('express');
const app = express();
const router = express.Router();
var os = require('os');

const port = 8080;

router.use(function (req,res,next) {
  console.log('/' + req.method);
  next();
});

router.get('/', function(req,res){
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`My Hostname: ${os.hostname()}\n`);
});

app.use('/', router);

app.listen(port, function () {
  console.log('Example app listening on port 8080!')
})