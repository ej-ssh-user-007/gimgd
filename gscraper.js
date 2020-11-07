const puppeteer = require('puppeteer');
const querystring = require('querystring');
const axios = require('axios');

const config = {
    thumbLink: '.wXeWr.islib.nfEiy.mM5pbd',
    thumbSelector: '.Q4LuWd',
    imageSelector: '.n3VNCb',
    clickWait: 1000,
    url: (query) => `https://www.google.com/search?q=${query}&source=lnms&tbm=isch`
}


async function googleImageLinks(query, config) {
    // tbm=isch params takes query directly to the google image page
    const url = config.url(query);

    const browser = await puppeteer.launch({headless: false});

    const page = await browser.newPage();

    await page.goto(url);

    
    const thumbLink = await page.$$(config.thumbLink);

    
    for (const link of thumbLink) {
        await link.click();

        const href = await link.getProperty('href');

        console.log(querystring.parse(href._remoteObject.value));
    }

}



(async () =>{
    const searchPage  = await googleImageLinks('dogs', config);

    // const imageLinks = extractImageLinksFromPage(searchPage);

    // imageLinks.each(function(i, e) {
    //     console.log(e);
    // });

    
})()
