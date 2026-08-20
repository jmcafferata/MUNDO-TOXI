const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "dist", "university.html");
if (!fs.existsSync(htmlPath)) {
  console.error("dist/university.html not found");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");

function getTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1] : "";
}

function getMetaDescription(html) {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  return match ? match[1] : "";
}

function getMetaProperty(html, property) {
  const regex = new RegExp('<meta[^>]*(?:property|name)=["\']' + property + '["\'][^>]*content=["\']([^"\']*)["\']', 'i');
  const regexReverse = new RegExp('<meta[^>]*content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + property + '["\']', 'i');
  const match = html.match(regex) || html.match(regexReverse);
  return match ? match[1] : null;
}

const title = getTitle(html);
const desc = getMetaDescription(html);
const ogDesc = getMetaProperty(html, "og:description");
const ogImg = getMetaProperty(html, "og:image");
const twImg = getMetaProperty(html, "twitter:image");
const twCard = getMetaProperty(html, "twitter:card");
const ogSiteName = getMetaProperty(html, "og:site_name");
const ogUrl = getMetaProperty(html, "og:url");

console.log(`Title: "${title}" (Length: ${title.length})`);
console.log(`Description: "${desc}" (Length: ${desc ? desc.length : 0})`);
console.log(`og:description: "${ogDesc}" (Length: ${ogDesc ? ogDesc.length : 0})`);
console.log(`og:image: "${ogImg}"`);
console.log(`twitter:image: "${twImg}"`);
console.log(`twitter:card: "${twCard}"`);
console.log(`og:site_name: "${ogSiteName}"`);
console.log(`og:url: "${ogUrl}"`);

let ok = true;

// Checks
if (title.length >= 50 && title.length <= 60) {
  console.log("PASS: Title length 50-60");
} else {
  console.log("FAIL: Title length 50-60");
  ok = false;
}

if (desc && desc.length >= 120 && desc.length <= 160) {
  console.log("PASS: Meta Description length 120-160");
} else {
  console.log("FAIL: Meta Description length 120-160");
  ok = false;
}

if (ogDesc && ogDesc.length >= 80 && ogDesc.length <= 125) {
  console.log("PASS: og:description length 80-125");
} else {
  console.log("FAIL: og:description length 80-125");
  ok = false;
}

if (ogImg === "https://www.toxi.media/university-og.jpg") {
  console.log("PASS: og:image is correct");
} else {
  console.log("FAIL: og:image mismatch");
  ok = false;
}

if (twImg === "https://www.toxi.media/university-og.jpg") {
  console.log("PASS: twitter:image is correct");
} else {
  console.log("FAIL: twitter:image mismatch");
  ok = false;
}

if (twCard === "summary_large_image") {
  console.log("PASS: twitter:card is summary_large_image");
} else {
  console.log("FAIL: twitter:card incorrect");
  ok = false;
}

if (ogSiteName !== null) {
  console.log("PASS: og:site_name exists");
} else {
  console.log("FAIL: og:site_name missing");
  ok = false;
}

if (ogUrl !== null) {
  console.log("PASS: og:url exists");
} else {
  console.log("FAIL: og:url missing");
  ok = false;
}

if (!ok) {
  process.exit(1);
} else {
  console.log("ALL HTML CHECKS PASSED!");
}
