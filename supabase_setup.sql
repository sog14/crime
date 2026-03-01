-- SQL for Supabase SQL Editor

-- Create the crime_records table
CREATE TABLE IF NOT EXISTS crime_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    district_name TEXT NOT NULL,
    police_station TEXT NOT NULL,
    fir_no TEXT NOT NULL,
    fir_date TEXT NOT NULL,
    complainant TEXT,
    address TEXT,
    accused TEXT,
    sections TEXT NOT NULL,
    incident_date TEXT,
    place_of_occurrence_gr TEXT, -- Stored as "lat,lng"
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE crime_records ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read (for this demo)
CREATE POLICY "Allow public read access" ON crime_records FOR SELECT USING (true);

-- Create a policy that allows anyone to insert (for this demo)
CREATE POLICY "Allow public insert access" ON crime_records FOR INSERT WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_crime_records_fir_date ON crime_records(fir_date);
CREATE INDEX idx_crime_records_police_station ON crime_records(police_station);
