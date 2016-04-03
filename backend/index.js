/* Dependencies */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var crypto = require('crypto');
var request = require('request');

var generateHash = function() {
  var hashGen = crypto.createHash('sha256');
  hashGen.update((Date.now()+(Math.random()*1000)).toString());
  var hash = hashGen.digest('hex');
  return hash;
}

/* Init app */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,token');

    // Pass to next layer of middleware
    next();
});

var port = process.env.PORT || 8080;

/* Routes */
var router = express.Router();

router.use(function(req, res, next) {
  next();
});


/* Create api endpoints */

router.route('/token')
  .post(function(req, res) {
    var city = req.body.city;
    var lat = req.body.lat;
    var lng = req.body.lng;
    var country = req.body.country;
    var hash;

    if(req.body.hash != null) {
      console.log('Using previous hash');
      hash = req.body.hash;
    } else {
      console.log('No previous hash..');
      hash = generateHash();
    }

    var body = {
      client_id: "81e8a76e-1e02-4d17-9ba0-8a7020261b26",
      device_uid:hash,
      location:{ city: city,
                 loc_coordinates: {lat: lat, lng: lng},
                 country: country,
                 loc_accuracy:30.000
               }};

    request({
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        uri: 'https://api.go-tellm.com/api/v2/users/',
        body: JSON.stringify(body),
        method: 'POST'
      }, function (req_err, req_res, req_body) {
        var parsed_json = JSON.parse(req_body);
        parsed_json.hash = hash;
        res.send(JSON.stringify(parsed_json));
      });
  });

router.route('/posts')
  .get(function(req, res) {
    var token = req.get('token');
    token = 'Bearer ' + token;
    request({
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': token
        },
        uri: 'https://api.go-tellm.com/api/v2/posts/',
        method: 'GET'
      }, function (req_err, req_res, req_body) {
        res.send(req_body);
      });

  });


/* Use router without prefix */
app.use('/', router);


/* Start server */
app.listen(port);
console.log('Started server on port: ' + port);
