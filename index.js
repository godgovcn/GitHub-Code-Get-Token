#!/usr/bin/nodejs
var express = require('express');
var app = express();
var bodyparser = require('body-parser');
var axios = require('axios')
var fs = require('fs')
var conf = {}
fs.readFile('./conf.json', 'utf-8', function (err, data) {
  if (err) {
    process.exit(0)
  } else {
    conf = JSON.parse(data)
    app.use(bodyparser.urlencoded({ extended: true }));
    app.use(bodyparser.json());
    app.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', conf.origin);
      res.header('Access-Control-Allow-Methods', 'POST');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Content-Type', 'application/json;charset=utf-8');
      next();
    })
    app.post('/', function (req, res) {
      var ret = {
        'state': false,
      }
      if (typeof (req.body.code) == "undefined") {
        res['desc'] = 'bad_parameter';
        res.send(ret)
      } else {
        axios.post('https://github.com/login/oauth/access_token', {
          'client_id': conf.client_id,
          'client_secret': conf.client_secret,
          'code': req.body.code
        }, {
            headers: {
              'Accept': 'application/json',
            }
          }).then(function (response) {
            if (typeof (response.data.error) == "undefined") {
              ret['state'] = true
              ret['token'] = response.data.access_token
            } else {
              ret['desc'] = response.data.error
            }
            res.send(ret)
          }).catch(function (error) {
            res.send({
              'error': error
            });
          });
      }
    })
    if (conf.ssl.open) {
      var https = require('https');
      var privateKey = fs.readFileSync(conf.ssl.key, 'utf8')
      var certificate = fs.readFileSync(conf.ssl.cert, 'utf8');
      var credentials = { key: privateKey, cert: certificate };
      var httpsServer = https.createServer(credentials, app);
      httpsServer.listen(conf.port, function () {});
    } else {
      var server = app.listen(conf.port, function () {
        var host = server.address().address
        var port = server.address().port;
      })
    }
  }
})