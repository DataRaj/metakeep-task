// pages/api/telemetry/stats.ts
import { DynamoDBClient, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from "next/server";

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

// GET handler for retrieving telemetry stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'hour';
    const page = searchParams.get('page') || 'all';
    
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
    
    return NextResponse.json(filledData);
  } catch (error) {
    console.error('Error fetching telemetry stats:', error);
    return NextResponse.json({ message: 'Failed to fetch telemetry stats' });
  }
}

// POST handler for recording telemetry data
export async function POST(req: NextApiRequest) {
  try {
    const { page, timestamp } = req.body;
    
    if (!page) {
      return NextResponse.json({ message: 'Page parameter is required' });
    }
    
    const now = timestamp ? new Date(timestamp) : new Date();
    
    // Format the minuteTimestamp (for aggregation)
    const minuteDate = new Date(now);
    minuteDate.setSeconds(0, 0); // Zero out seconds and milliseconds
    const minuteTimestamp = minuteDate.toISOString();
    
    // Create a telemetry entry
    const telemetryEntry: TelemetryEntry = {
      page,
      timestamp: now.toISOString(),
      minuteTimestamp,
    };
    
    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: TELEMETRY_TABLE,
      Item: telemetryEntry,
    });
    await docClient.send(putCommand);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording telemetry:', error);
    return NextResponse.json({ message: 'Failed to record telemetry' });
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