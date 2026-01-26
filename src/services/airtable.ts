import axios from 'axios';
import { logger } from '@/lib/logger';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

export interface AirtablePayload {
  id: string;
  sequences: any;
  caption: string;
}

export async function fetchApprovedRecord(
  baseId: string,
  tableId: string,
  token: string,
  templateId: string
): Promise<AirtablePayload | null> {
  const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;

  try {
    logger.info({ baseId, tableId }, 'Fetching approved records from Airtable...');
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        filterByFormula: "{status} = 'Approved'",
        maxRecords: 1,
      },
    });

    const records = response.data.records;
    if (!records || records.length === 0) {
      logger.info({ baseId, tableId }, 'No approved records found in Airtable.');
      return null;
    }

    const record = records[0];

    // Field mapping based on template
    // This could be moved to a configuration-based mapping later
    const sequences =
      templateId === 'asfa-t1'
        ? {
            hook: record.fields.text_1_hook,
            problem: record.fields.text_2_problem,
            solution: record.fields.text_3_solution,
            cta: record.fields.text_4_action,
          }
        : {
            hook: record.fields.text_1_hook,
            message: record.fields.text_2_message,
          };

    return {
      id: record.id,
      sequences,
      caption: record.fields.caption,
    };
  } catch (error: any) {
    const err = error.response?.data || error.message;
    logger.error({ err, baseId, tableId }, 'Failed to fetch from Airtable');
    throw new Error(`Airtable Fetch Error: ${JSON.stringify(err)}`);
  }
}

export async function updateRecordToProcessed(
  baseId: string,
  tableId: string,
  token: string,
  recordId: string
) {
  const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;

  try {
    logger.info({ recordId, tableId }, 'Updating Airtable record status to Processed...');
    await axios.patch(
      url,
      {
        records: [
          {
            id: recordId,
            fields: {
              status: 'Processed',
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    logger.info({ recordId }, 'Airtable record updated successfully.');
  } catch (error: any) {
    const err = error.response?.data || error.message;
    logger.error({ err, recordId }, 'Failed to update Airtable record');
    throw new Error(`Airtable Update Error: ${JSON.stringify(err)}`);
  }
}
