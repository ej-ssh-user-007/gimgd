const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const puppeteer = require('puppeteer');
const mime = require('mime-types');
const filenamify = require('filenamify');

const config = {
    thumbLinkSelector: '.wXeWr.islib.nfEiy.mM5pbd',
    thumbSelector: '.Q4LuWd',
    imageSelector: '.n3VNCb',
    imageLimit: 5,
    url: (label) => `https://www.google.com/search?q=${label}&source=lnms&tbm=isch`
}


async function googleImageLinks(label, config) {
    // tbm=isch params takes use directly to the google image page
    const url = config.url(label);

    const browser = await puppeteer.launch({headless: false});

    const page = await browser.newPage();

    await page.goto(url);

    
    let thumbLinks = await page.$$(config.thumbLinkSelector);

    let imageLinks = [];

    for (let i = 0; i < config.imageLimit; i++) {
        await thumbLinks[i].click();

        const href = await thumbLinks[i].getProperty('href');

        const params = (new URL(href._remoteObject.value)).searchParams;

        imageLinks.push(params.get('imgurl'));

        if (i + 1 === thumbLinks.length) {
            thumbLinks = await page.$$(config.thumbLinkSelector);
        }
        
    }

    return imageLinks;
}


async function downloadAndSaveImage(imageLink, label){
    try {

        const url = new URL(imageLink);

        label = filenamify(label);

        const filename = `./data/${label}/${filenamify(url.pathname)}`;

        console.log(url)

        switch (url.protocol) {
            case 'http:':
                http.get(imageLink, function(res) {
                    const ext = mime.extension(res.headers['content-type']);
                    res.pipe(fs.createWriteStream(`${filename}.${ext}`));
                });
                break;
            case 'https:':
                https.get(imageLink, function(res) {
                    const ext = mime.extension(res.headers['content-type']);
                    res.pipe(fs.createWriteStream(`${filename}.${ext}`));
                });
                break;
            default:
                console.log(`Error: Invalid Protocol: ${url.protocol}`);
                
        }

    } catch (error) {
        console.log(`Error saving image to disk ${imageLink}: ${error.message}`)
    }
}


async function downloadAll(imageLinks, label){

    await Promise.all(imageLinks.map(imgLnk => downloadAndSaveImage(imgLnk, label)))
}



(async () =>{
    // const searchPage  = await googleImageLinks('dogs', config);

    const images = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Collage_of_Nine_Dogs.jpg/1200px-Collage_of_Nine_Dogs.jpg',
        'https://i.ytimg.com/vi/MPV2METPeJU/maxresdefault.jpg',
        'https://i.insider.com/5484d9d1eab8ea3017b17e29?width=600&format=jpeg&auto=webp',
        'https://post.greatist.com/wp-content/uploads/sites/3/2020/02/322868_1100-800x825.jpg'
      ];





    // const imageLinks = extractImageLinksFromPage(searchPage);

    // imageLinks.each(function(i, e) {
    //     console.log(e);
    // });

    await downloadAndSaveImage(images, 'label')

    
})()
