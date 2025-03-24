// pages/api/telemetry/stats.ts
import { DynamoDBClient, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TELEMETRY_TABLE = process.env.DYNAMODB_TELEMETRY_TABLE || "metakeep-telemetry";

interface TelemetryEntry {
  page: string;
  timestamp: string;
  minuteTimestamp: string;
  count?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { range = 'hour', page = 'all' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime = new Date(now);
    
    switch (range) {
      case 'hour':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(now.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        break;
      default:
        startTime.setHours(now.getHours() - 1); // Default to hour
    }

    // Create GSI for minuteTimestamp and potentially a page filter
    // For production, you would want to create a proper GSI in your DynamoDB table

    // Query params based on whether we're filtering by page
    const queryParams: QueryCommandInput = {
      TableName: TELEMETRY_TABLE,
      // Use appropriate GSI or local index
      IndexName: "minuteTimestamp-index", // You need to create this GSI on your table
      KeyConditionExpression: "minuteTimestamp >= :startTime",
      ExpressionAttributeValues: {
        ":startTime": { S: startTime.toISOString() },
      },
    };

    // If specific page is requested, add FilterExpression
    if (page !== 'all') {
      queryParams.FilterExpression = "page = :page";
      queryParams.ExpressionAttributeValues = queryParams.ExpressionAttributeValues || {};
      queryParams.ExpressionAttributeValues[":page"] = { S: Array.isArray(page) ? page[0] : page };
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    // Process data to aggregate by minuteTimestamp
    const aggregatedData = new Map<string, number>();
    
    if (result.Items) {
      result.Items.forEach((item: any) => {
        const minuteTimestamp = item.minuteTimestamp;
        aggregatedData.set(
          minuteTimestamp, 
          (aggregatedData.get(minuteTimestamp) || 0) + 1
        );
      });
    }

    // Convert to sorted array
    const statsData = Array.from(aggregatedData.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Ensure there are data points for every minute/hour/day in the range
    const filledData = fillMissingTimepoints(statsData, startTime, now, range as string);
    
    return res.status(200).json(filledData);
  } catch (error) {
    console.error('Error fetching telemetry stats:', error);
    return res.status(500).json({ message: 'Failed to fetch telemetry stats' });
  }
}

// Helper function to fill in missing time points with zero values
function fillMissingTimepoints(
  data: Array<{timestamp: string, count: number}>, 
  startTime: Date, 
  endTime: Date, 
  range: string
): Array<{timestamp: string, count: number}> {
  const filledData: Array<{timestamp: string, count: number}> = [];
  const dataMap = new Map(data.map(item => [item.timestamp, item.count]));
  
  let currentTime = new Date(startTime);
  const increment = range === 'hour' || range === 'day' ? 60000 : 86400000; // 1 min or 1 day in ms
  
  while (currentTime <= endTime) {
    const timeKey = getTimeKey(currentTime, range);
    filledData.push({
      timestamp: timeKey,
      count: dataMap.get(timeKey) || 0
    });
    
    // Increment by appropriate time unit
    currentTime = new Date(currentTime.getTime() + increment);
  }
  
  return filledData;
}

// Helper function to format timestamp based on range
function getTimeKey(date: Date, range: string): string {
  // Create consistent time keys
  const newDate = new Date(date);
  if (range === 'hour' || range === 'day') {
    newDate.setSeconds(0, 0); // Zero out seconds and milliseconds for minute precision
  } else if (range === 'week') {
    newDate.setHours(0, 0, 0, 0); // Zero out hours for day precision
  }
  return newDate.toISOString();
}