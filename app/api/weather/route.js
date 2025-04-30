import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = cosmosClient.database("weatherReadings");
const container = database.container("data");

export async function GET() {
  try {
    const querySpec = {
      query: `
        SELECT TOP 24
          c.temperature,
          c.relativeHumidity,
          c.timestamp,
          c.windSpeed,
          c.windGust,
          c.windDirection,
          c.skyCover,
          c.probabilityOfPrecipitation
        FROM c
        ORDER BY c.timestamp DESC
      `
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    if (resources.length > 0) {
      // Convert temperatures from Celsius to Fahrenheit
      const convertedData = resources.map(item => ({
        ...item,
        temperature: item.temperature !== null && item.temperature !== undefined 
        ? Math.round(((item.temperature * 9/5) + 32) * 10) / 10
        : null
      }));

      return Response.json(convertedData, { status: 200 });
    } else {
      return Response.json({ message: "No data found" }, { status: 404 });
    }
  } catch (error) {
    return Response.json({ message: "Error fetching data", error: error.message }, { status: 500 });
  }
}
