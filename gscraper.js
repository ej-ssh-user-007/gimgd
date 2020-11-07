const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const puppeteer = require('puppeteer');
const mime = require('mime-types');
const filenamify = require('filenamify');


async function googleImageLinks(label, config) {
    // tbm=isch params takes use directly to the google image page
    const url = config.url(label);

    // launch headless browser to make page interaction from code possible
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto(url);
    
    let thumbLinks = await page.$$(config.thumbLinkSelector);

    let imageLinks = [];

    for (let i = 0; i < config.imageLimit; i++) {

        try {

            // original image link appears after clicking
            await thumbLinks[i].click();

            // image actually appears in href property of link
            const href = await thumbLinks[i].getProperty('href');

            // futher processing to get image link from href
            const params = (new URL(href._remoteObject.value)).searchParams;

            imageLinks.push(params.get('imgurl'));

            console.log(`Found: ${params.get('imgurl')}`);

            if (i + 1 === thumbLinks.length) {
                thumbLinks = await page.$$(config.thumbLinkSelector);
            }
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
            break;
        }
        
    }

    await browser.close();

    return imageLinks;
}


async function downloadAndSaveImage(imageLink, label){
    try {
        const url = new URL(imageLink);

        label = filenamify(label);

        const dir = `./data/${label}`;

        await fs.promises.mkdir(dir, {recursive: true});

        const filename = `${dir}/${filenamify(url.pathname)}`;

        console.log(`Downloading: ${url}`);

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


async function downloadLabel(imageLinks, label){
    await Promise.all(imageLinks.map(imgLnk => downloadAndSaveImage(imgLnk, label)));
}


module.exports = {
    getImageLinks: googleImageLinks,
    downloadLabel
}
