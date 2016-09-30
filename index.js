var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true })
var cheerio = require('cheerio');

const ENTRIES_MUL_MINUTE = 6000;

function click(target, callback) {
  nightmare
    .goto('https://www.steamgifts.com/' + target.link)
    .wait('body')
    .then(function() {
      console.log(target.link);
      setTimeout(function(){
        callback();
      }, 4000);
    })
}

function clickThrough(targets) {
  click(targets[0], function() {
    targets.shift();

    if(targets.length > 0) {
      clickThrough(targets);
    }
    else {
      return;
    }
  })
}

function start() {
  nightmare
    .goto('https://www.steamgifts.com/')
    // .type('form[action*="/search"] [name=p]', 'github nightmare')
    // .click('form[action*="/search"] [type=submit]')
    .wait('.page__outer-wrap')
    .evaluate(function () {
      return document.querySelector('.page__outer-wrap').innerHTML;
    })
    .then(function (result) {
      let $ = cheerio.load(result);
      var targets = [];

      $('.giveaway__row-inner-wrap').each(function(i, el) {
        if(!$(this).hasClass('is-faded')) {
          var obj = {};
          var time = $(this).find('.giveaway__columns').text().trim();

          if(time.indexOf('hour') !== -1) {
            return
          }

          var name = $(this).find('.giveaway__heading__name').text();
          var link = $(this).find('.giveaway__heading__name').attr('href');
          var minute = parseInt(time.split('minutes')[0]);
          var entries = parseInt($(this).find('.giveaway__links a span').first().text().split('entries')[0].replace(/,/g, ""));

          if(entries*minute < ENTRIES_MUL_MINUTE) {
            targets.push({link:link, value:entries*minute});
          }

        }
      })

      targets.sort(function(a, b) {
        return a.value - b.value;
      })

      clickThrough(targets);
    })
    .catch(function (error) {
      console.error('Search failed:', error);
    });

    setTimeout(function() {
      start();
    }, 40*60*1000);
}

start();
