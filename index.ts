import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { InvestorLinkScraper, StartupLinkScraper } from "./src/linkScraper";

const baseUrl = "https://www.eu-startups.com/investor-location";
const countries = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "GB",
];

async function getCompanyListings(url: string) {
  const res = await fetch(url).then((res) => res.text());
  const $ = cheerio.load(res);
  const companies: { name: string; link?: string }[] = [];

  const elements = $("h1.inv-single-title");
  if (elements.length === 0) {
    console.log(`No companies found for ${url}`);
    return companies;
  }

  elements.each((index, element) => {
    const companyName = $(element).text().trim();

    const companyLink = $(element).parent("a").attr("href");

    companies.push({
      name: companyName,
      link: companyLink,
    });
  });
  return companies;
}

async function scrapeCountry(baseUrl: string, country: string) {
  const companies: { name: string; link?: string }[] = [];
  const batchSize = 1;
  let pageNumber = 1;
  let hasMorePages = true;

  console.log(`\n🌍 Starting to scrape ${country}...`);

  while (hasMorePages) {
    const batchLinks = Array.from(
      { length: batchSize },
      (_, i) => `${baseUrl}/page/${pageNumber + i}/?country=${country}`
    );

    console.log(batchLinks);

    console.log(
      `  📄 Processing ${country}: pages ${pageNumber} to ${
        pageNumber + batchSize - 1
      }`
    );

    const batchResults = await Promise.all(batchLinks.map(getCompanyListings));

    const hasResults = batchResults.some((result) => result.length > 0);

    if (!hasResults) {
      console.log(
        `  ⏹️  No results found in ${country} batch starting at page ${pageNumber}. Stopping.`
      );
      hasMorePages = false;
    } else {
      const batchCompanies = batchResults.flat();
      companies.push(...batchCompanies);
      console.log(
        `  ✅ Found ${batchCompanies.length} companies in this ${country} batch`
      );

      pageNumber += batchSize;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `🎉 ${country.toUpperCase()}: Total companies found: ${companies.length}`
  );

  // Save to country-specific CSV file
  const filename = `${country}-investors.csv`;
  saveToCSV(companies, filename);

  return { country: country, companies, filename };
}

async function main() {
  console.log(
    `🚀 Starting to scrape ${countries.length} countries in parallel...`
  );

  // Process all countries in parallel
  const results = await Promise.all(
    countries.map((country) => scrapeCountry(baseUrl, country))
  );

  // Summary
  console.log("\n📊 SCRAPING SUMMARY:");
  console.log("=".repeat(50));

  let totalCompanies = 0;
  results.forEach(({ country, companies, filename }) => {
    console.log(
      `${country.toUpperCase()}: ${companies.length} companies → ${filename}`
    );
    totalCompanies += companies.length;
  });

  console.log("=".repeat(50));
  console.log(
    `🎯 TOTAL: ${totalCompanies} companies across ${results.length} countries`
  );
  console.log(`📁 Files created: ${results.map((r) => r.filename).join(", ")}`);
}

function saveToCSV(data: { name: string; link?: string }[], filename: string) {
  // Create CSV header
  const headers = "Name,Link\n";

  // Convert data to CSV rows
  const csvRows = data.map((company) => {
    const name = `"${company.name.replace(/"/g, '""')}"`; // Escape quotes in names
    const link = company.link ? `"${company.link}"` : '""'; // Handle missing links
    return `${name},${link}`;
  });

  // Combine header and rows
  const csvContent = headers + csvRows.join("\n");

  // Write to file
  writeFileSync(filename, csvContent, "utf8");
  console.log(`  💾 Data saved to ${filename}`);
}

// main();

const investorLinkScraper = new InvestorLinkScraper("data/investors");
investorLinkScraper.scrapeAllCountries();
