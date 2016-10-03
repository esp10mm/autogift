var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true })
var cheerio = require('cheerio');

const ENTRIES_MUL_MINUTE = 6000;

function shouldClick(entry) {
  if(entry.time.indexOf('hour') !== -1) {
    return
  }
  if(entry.value < ENTRIES_MUL_MINUTE) {
    return true;
  }

}

function parseEntry(el) {
  var time = el.find('.giveaway__columns').text().trim();
  var name = el.find('.giveaway__heading__name').text();
  var link = el.find('.giveaway__heading__name').attr('href');
  var minute = parseInt(time.split('minutes')[0]);
  var entries = parseInt(el.find('.giveaway__links a span').first().text().split('entries')[0].replace(/,/g, ""));

  var result = {
    time: time,
    name: name,
    link: link,
    minute: minute,
    entries: entries,
    value: minute*entries,
  }

  return result;
}

function click(target, callback) {
  nightmare
    .goto('https://www.steamgifts.com/' + target.link)
    .wait('body')
    // .click('form[action*="/search"] [type=submit]')
    .click('.sidebar__entry-insert')
    .then(function() {
      console.log(target.link + '... clicked!');
      setTimeout(function(){
        callback();
      }, 4000);
    })
}

function clickThrough(targets) {
  if(targets.length == 0) {
    console.log('No target remained');
    return;
  }
  click(targets[0], function() {
    targets.shift();
    clickThrough(targets);
  })
}

function start() {
  nightmare
    .goto('https://www.steamgifts.com/')
    // .type('form[action*="/search"] [name=p]', 'github nightmare')
    .wait('.page__outer-wrap')
    .evaluate(function () {
      return document.querySelector('.page__outer-wrap').innerHTML;
    })
    .then(function (result) {
      let $ = cheerio.load(result);
      var targets = [];

      $('.giveaway__row-inner-wrap').each(function(i, el) {
        if(!$(this).hasClass('is-faded')) {
          
          var obj = parseEntry($(this));

          if(shouldClick(obj)) {
            targets.push({link:obj.link, value:obj.value});
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
    }, 10*60*1000);
}

start();
