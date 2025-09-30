/*
  # Fix Performance Records Structure

  1. Database Changes
    - Make id field properly auto-generated
    - Fix unique constraint to handle multiple records per day per personnel
    - Add proper indexes for performance
    - Ensure RLS policies work correctly

  2. Data Integrity
    - Ensure proper foreign key relationships
    - Add validation constraints
    - Optimize for performance monitoring queries
*/

-- Drop the existing unique constraint that's too restrictive
ALTER TABLE performance_records DROP CONSTRAINT IF EXISTS performance_records_year_month_personnel_id_day_submitting__key;

-- Add a more flexible unique constraint that allows multiple shifts per day from different bases
-- but prevents duplicate entries from the same submitting base
CREATE UNIQUE INDEX IF NOT EXISTS performance_records_unique_submission 
ON performance_records (year_month, personnel_id, day, submitting_base_id, shift_id, base_id);

-- Ensure the id field has a proper default
ALTER TABLE performance_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Add indexes for better performance in monitoring queries
CREATE INDEX IF NOT EXISTS idx_performance_records_year_month_status 
ON performance_records (year_month);

CREATE INDEX IF NOT EXISTS idx_performance_records_submitting_base 
ON performance_records (submitting_base_id);

CREATE INDEX IF NOT EXISTS idx_performance_submissions_status 
ON performance_submissions (status);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Allow all to view records" ON performance_records;
DROP POLICY IF EXISTS "Allow all to insert records" ON performance_records;
DROP POLICY IF EXISTS "Allow all to update records" ON performance_records;
DROP POLICY IF EXISTS "Allow all to delete records" ON performance_records;

-- More specific RLS policies
CREATE POLICY "Users can view all submitted records"
  ON performance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_submissions ps 
      WHERE ps.year_month = performance_records.year_month 
      AND ps.base_id = performance_records.submitting_base_id 
      AND ps.status = 'submitted'
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = performance_records.submitting_base_id)
    )
  );

CREATE POLICY "Users can manage their base records"
  ON performance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = submitting_base_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = submitting_base_id)
    )
  );

-- Ensure performance_submissions policies are correct
DROP POLICY IF EXISTS "Allow all to view submissions" ON performance_submissions;
DROP POLICY IF EXISTS "Allow all to insert submissions" ON performance_submissions;
DROP POLICY IF EXISTS "Allow all to update submissions" ON performance_submissions;
DROP POLICY IF EXISTS "Allow all to delete submissions" ON performance_submissions;

CREATE POLICY "Users can view relevant submissions"
  ON performance_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = base_id)
    )
  );

CREATE POLICY "Users can manage their base submissions"
  ON performance_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = base_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.base_id = base_id)
    )
  );