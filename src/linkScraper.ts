import type { NameLinkData } from "./schema";
import * as fs from "fs";
import { readCsv, writeCsv } from "./utils/csvUtils";
import validate from "./utils/validator";
import { nameLinkDataSchema } from "./schema";
import * as cheerio from "cheerio";
import { toCamelCase } from "./utils/textUtils";
import path from "path";

abstract class LinkScraper {
  protected data: Map<string, NameLinkData>;
  constructor(dataSourceFolder: string, private readonly outPath: string) {
    const filePaths = fs
      .readdirSync(dataSourceFolder)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => `${dataSourceFolder}/${file}`);

    this.data = new Map(
      filePaths.map((filePath) => {
        const data = this.loadData(filePath);
        const name = path.basename(filePath).split(".")[0]!;
        return [name, data];
      })
    );
  }

  protected loadData(filePath: string) {
    const data = readCsv(filePath);
    const validatedData = validate(data, nameLinkDataSchema);
    return validatedData;
  }

  protected async scrapeLink(link: string) {
    const response = await fetch(link).then((res) => res.text());
    const $ = cheerio.load(response);
    return $;
  }

  protected abstract scrapeEntryLink(
    data: NameLinkData[number],
    country?: string
  ): Promise<Record<string, string | null>>;

  protected async scrapeSingle(
    chunk: NameLinkData,
    key: string,
    namingFunction?: (country: string) => string,
    i?: number
  ) {
    const subChunks = Array.from(
      { length: Math.ceil(chunk.length / 100) },
      (_, index) => chunk.slice(index * 100, (index + 1) * 100)
    );

    const scrapedData = [];
    for (const subChunk of subChunks) {
      try {
        while (true) {
          scrapedData.push(
            ...(await Promise.all(
              subChunk.map((entry) => this.scrapeEntryLink(entry, key))
            ))
          );
          break;
        }
      } catch (error) {
        console.error(error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      console.log(
        `Scraped ${scrapedData.length} / ${chunk.length} ${
          i !== undefined && `in chunk ${i + 1} / ${this.data.size}`
        }`
      );
    }

    writeCsv(
      scrapedData,
      path.join(this.outPath, namingFunction?.(key) ?? `${key}.csv`)
    );
  }

  protected async scrapeAll(namingFunction?: (country: string) => string) {
    console.log(`Scraping ${this.data.size} entries`);
    let i = 0;
    for (const [key, chunk] of this.data.entries()) {
      await this.scrapeSingle(chunk, key, namingFunction, i);
      i++;
    }
  }
}

export class StartupLinkScraper extends LinkScraper {
  constructor(dataSourceFolder: string) {
    super(dataSourceFolder, "data/enriched/startups");
  }

  protected async scrapeEntryLink(
    data: NameLinkData[number],
    country?: string
  ): Promise<Record<string, string | null>> {
    const { name, link } = data;
    const $ = await super.scrapeLink(link);

    const element = $(".listing-details .wpbdp-field-display");
    if (element.length === 0) {
      return { name, link };
    }

    const details: Record<string, string | null> = {};

    element.each((i, element) => {
      const label = $(element)
        .find(".field-label")
        .text()
        .replace(":", "")
        .trim();
      const camelCaseLabel = toCamelCase(label);
      let value: string | null = $(element).find(".value").text().trim();

      if (camelCaseLabel === "longBusinessDescription") {
        value = $(element).find(".value").text().trim();
      }

      if (camelCaseLabel === "website") {
        value = $(element).find(".value").text().trim();
      }

      details[camelCaseLabel] = value;
    });

    $(".listing-details .social-fields a").each((i, element) => {
      const socialPlatform = $(element)
        .parent()
        .attr("class")
        ?.replace("social-field ", "");
      const camelCasePlatform = socialPlatform
        ? toCamelCase(socialPlatform)
        : null;
      if (camelCasePlatform) {
        details[camelCasePlatform] = $(element).attr("href") ?? null;
      }
    });

    return {
      name,
      link,
      ...details,
      country: country ?? null,
    } satisfies Record<string, string | null>;
  }

  async scrapeAllCountries() {
    await super.scrapeAll();
  }

  async scrapeSingleCountry(filePath: string) {
    const data = super.loadData(filePath);
    const key = path.basename(filePath).split(".")[0]!;
    await super.scrapeSingle(data, key);
  }
}

export class InvestorLinkScraper extends LinkScraper {
  constructor(dataSourceFolder: string) {
    super(dataSourceFolder, "data/enriched/investors");
  }

  protected async scrapeEntryLink(
    data: NameLinkData[number],
    country?: string
  ): Promise<Record<string, string | null>> {
    const { name, link } = data;
    const $ = await super.scrapeLink(link);

    const details: Record<string, string | null> = {};
    const container = $(".inv-single-right");
    const description = container.find(".inv-single-desc span").text().trim();
    if (description) {
      details.description = description;
    }

    container
      .children("div")
      .not(".inv-single-desc")
      .each((i, element) => {
        const labelElement = $(element).find("h5");
        if (labelElement.length) {
          const label = labelElement.text().replace(":", "").trim();
          const camelCaseLabel = toCamelCase(label);

          let valueElement = $(element).find("span");
          if (valueElement.length) {
            details[camelCaseLabel] = valueElement.text().trim();
          } else {
            valueElement = $(element).find("a");
            if (valueElement.length) {
              details[camelCaseLabel] =
                valueElement.attr("href")?.trim() ?? null;
            }
          }
        }
      });

    return {
      name,
      link,
      ...details,
      country: country ?? null,
    } satisfies Record<string, string | null>;
  }

  async scrapeAllCountries() {
    await super.scrapeAll();
  }

  async scrapeSingleCountry(filePath: string) {
    const data = super.loadData(filePath);
    const key = path.basename(filePath).split(".")[0]!;
    await super.scrapeSingle(data, key);
  }
}
