const express = require("express");
const puppeteer = require("puppeteer");
const Groq = require("groq-sdk");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(bodyParser.json());
require("dotenv").config();

app.use(cors());

const groq = new Groq({
  apiKey: process.env.KEY,
});

async function getPageContent(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const content = await page.evaluate(() => document.body.innerText);
  await browser.close();
  return content;
}

async function getGroqChatCompletion(contents, title) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `give brief data related to this product title only [${title}] in the content I have given in 2-3 points and each point should be one line, content: [${contents}]`,
        },
      ],
      model: "llama3-8b-8192",
    });
    return response; // Ensure you return the entire response
  } catch (error) {
    console.error("Error in getGroqChatCompletion:", error);
    throw error;
  }
}

async function processArray(dataArray) {
  const results = [];
  for (const item of dataArray) {
    try {
      console.log(`Processing ${item.loc} `);
      const content = await getPageContent(item.loc); // Assuming getPageContent is defined elsewhere
      const briefResponse = await getGroqChatCompletion(
        content,
        item.imageTitle
      );
      const brief = briefResponse.choices[0]?.message?.content || ""; // Access the JSON data
      results.push({
        loc: item.loc,
        imageUrl: item.imageUrl,
        imageTitle: item.imageTitle,
        brief,
      });
    } catch (error) {
      console.error("Error processing item:", error);
    }
  }
  return results;
}

app.post("/scrape", async (req, res) => {
 // console.log("request comes");
  let browser;
  try {
    const { url } = req.body;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--ignore-certificate-errors", "--start-maximized"],
    });
    // url = "skindulge.in";
    const page = await browser.newPage();
    await page.goto(`https://${url}/robots.txt`);

    const content = await page.evaluate(() => {
      const preTag = document.querySelector("pre");
      return preTag ? preTag.textContent : "";
    });

    const sitemapRegex = /Sitemap:\s*(https?:\/\/[^\s]+)/i;
    const match = content.match(sitemapRegex);
    const sitemapUrl = match ? match[1] : null;

    if (!sitemapUrl) {
      await browser.close();
      return res.status(404).json({ error: "Sitemap URL not found" });
    }

    await page.goto(sitemapUrl);

    const locUrl = await page.evaluate(() => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(
        document.body.innerHTML,
        "text/xml"
      );
      const locElement = xmlDoc.querySelector("loc");
      return locElement ? locElement.textContent : null;
    });

    if (!locUrl) {
      await browser.close();
      return res.status(404).json({ error: "First <loc> tag not found" });
    }

    await page.goto(locUrl);

    const data = await page.evaluate(() => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(
        document.body.innerHTML,
        "text/xml"
      );
      const urls = Array.from(xmlDoc.getElementsByTagName("url"));
      return urls
        .map((url) => {
          const loc = url.getElementsByTagName("loc")[0]?.textContent || "";
          const imageElements = Array.from(
            url.getElementsByTagName("image:image")
          );
          if (imageElements.length > 0) {
            const imageElement = imageElements[0];
            const imageUrl =
              imageElement.getElementsByTagName("image:loc")[0]?.textContent ||
              "";
            const imageTitle =
              imageElement.getElementsByTagName("image:title")[0]
                ?.textContent || "";
            if (imageUrl && imageTitle) {
              return { loc, imageUrl, imageTitle };
            }
          }
          return null;
        })
        .filter((item) => item !== null)
        .slice(0, 5);
    });

    await browser.close();

    if (data.length === 0) {
      return res.status(404).json({ error: "No valid <url> entries found" });
    }

    const results = await processArray(data);
   // console.log("response submitted");
  //  console.log(results);
    res.json(results);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/',(req,res)=>{
  res.send('Hello World!')
})
app.listen(4000, () => console.log("Listening on port 4000"));
