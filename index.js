const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio');

let page;

const saveCookie = (cookies) => (new Promise((resolve) => {
  fs.writeFile('cookies.json', JSON.stringify(cookies), 'utf8', resolve);
}));

const loadCookie = () => (new Promise((resolve) => {
  fs.exists('cookies.json', (exists) => {
    if (exists) {
      fs.readFile('cookies.json', 'utf8', (err, data) => {
        resolve(JSON.parse(data));
      });
    } else {
      resolve([]);
    }
  });
}));

const shouldClick = (entry) => {
  if(entry.time.indexOf('hours remain') !== -1) {
    return false;
  }
  if(entry.entries < 500) {
    return true;
  }
  else {
    return false
  }
}

const parseEntry = (el) => {
  const time = el.find('.giveaway__columns').text().trim();
  const name = el.find('.giveaway__heading__name').text();
  let link = el.find('.giveaway__heading__name').attr('href');
  link = `https://www.steamgifts.com${link}`;
  const minute = parseInt(time.split('minutes')[0]);
  const entries = parseInt(el.find('.giveaway__links a span').first().text().split('entries')[0].replace(/,/g, ""));
  let copy = 1;

  const heading = el.find('.giveaway__heading').text().trim();
  if(heading.indexOf('Copies') !== -1) {
    copy = parseInt(heading.split('Copies')[0].split('(')[1]);
    if(isNaN(copy)) {
      copy = 1;
    }
  }

  const result = {
    time,
    name,
    link,
    minute,
    entries: entries/copy,
  }

  return result;
}

const click = ({ link }) => (
  new Promise(async (resolve) => {
    try {
      await page.goto(link);
      await page.waitFor('body');
      await page.click('.sidebar__entry-insert');
    } catch (e) {
      console.log(e);
    }
    await page.waitFor(4000);
    resolve();
  })
);

const frontPage = async () => {
  let cookies = await loadCookie();
  await Promise.all(cookies.map((c) => page.setCookie(c)));
  await page.goto('https://www.steamgifts.com/');
  await page.waitFor('.nav__button-container');
  console.log('Logined Front Page');
  cookies = await page.cookies();
  saveCookie(cookies);
  const html = await page.content();
  const $ = cheerio.load(html);
  const targets = [];

  $('.giveaway__row-inner-wrap').each(function(i, el) {
    if(!$(this).hasClass('is-faded')) {
      const obj = parseEntry($(this));
      if(shouldClick(obj)) {
        targets.push({ link: obj.link });
      }
    }
  })

  while (targets.length > 0) {
    await click(targets.shift());
  }

  await page.waitFor(180000);
  frontPage();
};

const main = async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: false });
  page = await browser.newPage();
  frontPage();
};

main();

