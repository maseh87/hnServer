var express = require('express');
var app = express();
var q = require('q');
var request = require('request');
var cors = require('cors');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var morgan = require('morgan');

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/articles');

var ArticleSchema = new mongoose.Schema({
  article_id: String,
  content: String,
  title: String,
  submitter: String
});

var Article = mongoose.model('articles', ArticleSchema);

app.use(cors());
app.use(morgan('dev'));

var options = {
  url: "https://community-hnify.p.mashape.com/get/best",
  headers: {
    "X-Mashape-Key": "ezm6j6ZDTTmshfYpcmqam21hJaXGp1taozKjsnkZZpn9dmHahi"
  }
};

app.get('/articles', function(req, res) {
  fetch(options)
    .then(preFetch)
    .then(createArticles)
    .then(function (results) {
      res.json(results);
    })
    .fail(function(err) {
      console.error(err);
      res.send(500);
    });
});

app.get('/article/:id', function (req, res) {
  var findOne = q.nbind(Article.findOne, Article);
  var id = req.params.id;
  findOne({'article_id': id})
    .then(function (article) {
      res.set('Content-type', 'text/html');
      res.send(article.content);
    })
    .fail(function (err) {
      console.error(err);
      res.send(500);
    });
})

// app.get('/test', function(req, res) {
//   res.set('Content-type', 'text/html');
//   res.send();
// });


app.listen(process.env.PORT || 3000);
console.log('App is listening');

function fetch(options, article){
  var defer = q.defer();
  request(options, function(err, response, body) {
    if(err) {
      defer.reject(err);
    } else {
      if (article) {
        defer.resolve({article: article, html: body});
      } else {
        defer.resolve(body);
      }
    }
  })
  return defer.promise;
};

function preFetch(body) {
  body = JSON.parse(body);
  var promises = [];
  for(var i = 0; i < body.stories.length; i++) {
    var obj = {
      id: body.stories[i].story_id,
      title: body.stories[i].title,
      submitter: body.stories[i].submitter
    };
    promises.push(fetch(body.stories[i].link, obj));
  }
  return q.allSettled(promises);
};

var createArticles = function (results) {
  var promises = [];
  for (var i = 0; i < results.length; i++) {
    if (results[i].state !== 'rejected') {
      var newArticle = {
        article_id: results[i].value.article.id,
        title: results[i].value.article.title,
        submitter: results[i].value.article.submitter,
        content: results[i].value.html
      }
      promises.push(Article.create(newArticle));
    }
  }
  console.log('herer');
  return q.allSettled(promises);
};

// request(body.stories[0].link, function(storyError, storyResponse, storyBody) {
    //   if(storyError) {
    //     return res.send(500);
    //   }
    //   var $ = cheerio.load(storyBody);
    //   cache.push($('body').html());
    //   res.send(200);
    // })