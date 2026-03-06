import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key has value:", !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing connection to Supabase...");
  
  // Test if 'memories' table exists
  const { data, error } = await supabase.from('memories').select('*').limit(1);
  
  if (error) {
    console.error("Error connecting to 'memories' table:", error);
    if (error.code === '42P01') {
      console.log("Table 'memories' does not exist!");
    }
  } else {
    console.log("Successfully connected to 'memories' table.");
    console.log("Current row count (preview):", data.length);
  }
  
  // Test if 'match_memories' RPC exists
  console.log("Testing 'match_memories' RPC...");
  // Dummy embedding (768 dimensions for Gemini text-embedding-004)
  const dummyEmbedding = new Array(768).fill(0);
  const { error: rpcError } = await supabase.rpc('match_memories', {
    query_embedding: dummyEmbedding,
    match_threshold: 0.5,
    match_count: 1
  });
  
  if (rpcError) {
    console.error("Error testing 'match_memories' RPC:", rpcError);
    if (rpcError.code === 'P0001' || rpcError.message.includes('function does not exist')) {
        console.log("RPC 'match_memories' does not exist or has incorrect arguments.");
    }
  } else {
    console.log("Successfully tested 'match_memories' RPC.");
  }
}

test();
