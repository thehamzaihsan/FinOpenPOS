#!/usr/bin/env node
/**
 * Initialize PocketBase collections from schema
 * This script creates all necessary collections in PocketBase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@pos.local';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'admin123456';

// Read schema
const schemaPath = path.join(__dirname, '../POCKETBASE_SCHEMA.json');
const collections = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

async function authenticate() {
  console.log('Authenticating with PocketBase admin...');
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

async function createCollection(collection, token) {
  const { name, type, schema } = collection;

  // Convert schema format to PocketBase format
  const pbFields = schema.map((field) => {
    const pbField = {
      name: field.name,
      type: field.type,
      required: field.required || false,
      system: false,
    };

    // Handle type-specific options
    if (field.type === 'select' && field.options?.values) {
      pbField.options = {
        values: field.options.values,
      };
    } else if (field.type === 'relation' && field.options?.collectionId) {
      pbField.options = {
        collectionId: field.options.collectionId,
        cascadeDelete: field.options.cascadeDelete || false,
        minSelect: null,
        maxSelect: 1,
        displayFields: [],
      };
    } else if (field.type === 'number') {
      pbField.options = {};
    } else if (field.type === 'text') {
      pbField.options = {
        pattern: '',
      };
    } else if (field.type === 'url') {
      pbField.options = {
        exceptDomains: [],
        onlyDomains: [],
      };
    }

    return pbField;
  });

  console.log(`Creating collection: ${name}`);
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        type,
        schema: pbFields,
        indexes: [],
        options: {},
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === 400 && error.message.includes('already exists')) {
        console.log(`  ✓ Collection ${name} already exists`);
        return;
      }
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    console.log(`  ✓ Collection ${name} created successfully`);
  } catch (error) {
    console.error(`  ✗ Error creating collection ${name}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔧 Initializing PocketBase collections...\n');

    const token = await authenticate();
    console.log('✓ Authentication successful\n');

    for (const collection of collections) {
      await createCollection(collection, token);
    }

    console.log('\n✅ PocketBase initialization complete!');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

main();
