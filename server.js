var express = require('express');
var app = express();
var q = require('q');
var request = require('request');
var cors = require('cors');
var cheerio = require('cheerio');

var morgan = require('morgan');

app.use(cors());
app.use(morgan('dev'));

var options = {
  url: "https://community-hnify.p.mashape.com/get/best",
  headers: {
    "X-Mashape-Key": "ezm6j6ZDTTmshfYpcmqam21hJaXGp1taozKjsnkZZpn9dmHahi"
  }
};
var cache = [];
app.get('/articles', function(req, res) {
  //get articles from mashape
  request(options, function(err, response, body) {
    if(err) {
      return res.send(500);
    }
    var body = JSON.parse(body);
    request(body.stories[0].link, function(storyError, storyResponse, storyBody) {
      if(storyError) {
        return res.send(500);
      }
      var $ = cheerio.load(storyBody);
      cache.push($('body').html());
      res.send(200);
    })
  })
  //pre fetch articles

  // res.send(200);
});

app.get('/test', function(req, res) {
  res.set('Content-type', 'text/html');
  res.send(cache[0]);
});


app.listen(process.env.PORT);
console.log('App is listening');

