import { supabase } from '../services/supabaseService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySqlFix() {
  try {
    console.log('🚀 Applying database schema update...');
    
    // Path to SQL file relative to the current script
    const sqlFilePath = path.join(__dirname, '../../sql/escalation_schema_update.sql');
    
    console.log(`Reading SQL file from: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    if (!sql) {
        throw new Error('SQL file is empty or not found.');
    }

    console.log('Executing SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      throw new Error(`Error executing RPC: ${error.message}`);
    }

    console.log('✅ Database schema successfully updated!');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

applySqlFix(); 