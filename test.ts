import { readCsv, writeCsv } from "./src/utils/csvUtils";

const data = readCsv("data/enriched/startups/UK.csv");

const newData = data.map((item) => ({
  ...item,
  country: "GB",
}));

writeCsv(newData, "data/enriched/startups/GB.csv");
