import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, MapPin, Loader2, Search, Target, Map as MapIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { LocationPicker } from './LocationPicker';
import { flexibleParseDate } from '../utils/crimeUtils';
import { DISTRICTS, POLICE_STATIONS } from '../constants';

const crimeSchema = z.object({
  district_name: z.string().min(1, "District is required"),
  police_station: z.string().min(1, "Police station is required"),
  fir_no: z.string().min(1, "FIR number is required"),
  fir_date: z.string().min(1, "FIR date is required"),
  complainant: z.string().optional(),
  address: z.string().optional(),
  accused: z.string().optional(),
  sections: z.string().min(1, "Sections are required"),
  incident_date: z.string().optional(),
}).refine((data) => {
  const fir = flexibleParseDate(data.fir_date);
  const incident = data.incident_date ? flexibleParseDate(data.incident_date) : null;
  if (fir && incident) {
    return fir >= incident;
  }
  return true; 
}, {
  message: "FIR date cannot be before incident date",
  path: ["fir_date"],
});

type CrimeFormValues = z.infer<typeof crimeSchema>;

interface CrimeEntryFormProps {
  onClose: () => void;
  onSuccess: (record?: any) => void;
  initialData?: any;
}

export function CrimeEntryForm({ onClose, onSuccess, initialData }: CrimeEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number }>(
    initialData ? { lat: initialData.lat, lng: initialData.lng } : { lat: 26.5944, lng: 85.4843 } // Default to Sitamarhi area
  );
  const [manualLat, setManualLat] = useState(location.lat.toString());
  const [manualLng, setManualLng] = useState(location.lng.toString());

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CrimeFormValues>({
    resolver: zodResolver(crimeSchema),
    defaultValues: initialData ? {
      district_name: initialData.district,
      police_station: initialData.policeStation,
      fir_no: initialData.firNo,
      fir_date: initialData.firDate ? (flexibleParseDate(initialData.firDate) ? format(flexibleParseDate(initialData.firDate)!, "yyyy-MM-dd'T'HH:mm") : initialData.firDate) : '',
      incident_date: initialData.incidentDate ? (flexibleParseDate(initialData.incidentDate) ? format(flexibleParseDate(initialData.incidentDate)!, "yyyy-MM-dd'T'HH:mm") : initialData.incidentDate) : '',
      sections: initialData.sections,
      complainant: initialData.complainant,
      accused: initialData.accused,
      address: initialData.address,
    } : {
      district_name: 'Sitamarhi',
    }
  });

  const selectedDistrict = watch('district_name');
  const availablePS = selectedDistrict ? POLICE_STATIONS[selectedDistrict] || [] : [];

  useEffect(() => {
    setManualLat(location.lat.toFixed(6));
    setManualLng(location.lng.toFixed(6));
  }, [location]);

  const handleManualGRSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng });
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Bihar, India')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert('Place not found. Try adding more details.');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (values: CrimeFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        latitude: location.lat,
        longitude: location.lng,
        place_of_occurrence_gr: `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`,
        fir_date: values.fir_date,
        incident_date: values.incident_date,
      };

      if (initialData?.id) {
        const { data, error } = await supabase
          .from('crime_records')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single();
        if (error) throw error;
        onSuccess(data);
      } else {
        const { data, error } = await supabase
          .from('crime_records')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        onSuccess(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error inserting crime record:', error);
      alert('Failed to save record. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                {initialData ? 'Edit Crime Record' : 'New Crime Entry'}
              </h2>
              <p className="text-sm text-zinc-500 font-medium">Capture detailed incident information and location</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-zinc-100 rounded-2xl transition-all text-zinc-400 hover:text-zinc-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">District</label>
                  <select 
                    {...register('district_name')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all appearance-none"
                  >
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district_name && <p className="text-[10px] text-red-500 font-bold">{errors.district_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Police Station</label>
                  <select 
                    {...register('police_station')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all appearance-none"
                  >
                    <option value="">Select Police Station</option>
                    {availablePS.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                  </select>
                  {errors.police_station && <p className="text-[10px] text-red-500 font-bold">{errors.police_station.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">FIR Number</label>
                  <input 
                    {...register('fir_no')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                    placeholder="e.g. 123/2024" 
                  />
                  {errors.fir_no && <p className="text-[10px] text-red-500 font-bold">{errors.fir_no.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">FIR Date</label>
                  <input 
                    type="datetime-local" 
                    {...register('fir_date')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                  />
                  {errors.fir_date && <p className="text-[10px] text-red-500 font-bold">{errors.fir_date.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sections (IPC/BNS)</label>
                <input 
                  {...register('sections')} 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                  placeholder="e.g. 302 IPC, 103 BNS" 
                />
                {errors.sections && <p className="text-[10px] text-red-500 font-bold">{errors.sections.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Incident Date & Time</label>
                <input 
                  type="datetime-local" 
                  {...register('incident_date')} 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                />
                {errors.incident_date && <p className="text-[10px] text-red-500 font-bold">{errors.incident_date.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Complainant</label>
                  <input 
                    {...register('complainant')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                    placeholder="Name of complainant" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Accused</label>
                  <input 
                    {...register('accused')} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                    placeholder="Name of accused" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Detailed Address</label>
                <textarea 
                  {...register('address')} 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all min-h-[100px] resize-none" 
                  placeholder="Enter full address of occurrence..." 
                />
              </div>
            </div>

            {/* Right Column: Location & Map */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapIcon size={18} className="text-red-600" />
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Place of Occurrence</h3>
                </div>

                {/* Search Place */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Search Location</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPlace())}
                      placeholder="Search village, town, or landmark..."
                      className="w-full pl-11 pr-24 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleSearchPlace}
                      disabled={searching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      {searching ? '...' : 'Search'}
                    </button>
                  </div>
                </div>

                {/* Manual GR Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manual Grid Reference (Lat, Lng)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="Latitude"
                      className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-mono outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                    <input 
                      type="text"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="Longitude"
                      className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-mono outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleManualGRSubmit}
                      className="bg-zinc-200 text-zinc-700 p-3 rounded-2xl hover:bg-zinc-300 transition-all"
                      title="Apply Coordinates"
                    >
                      <Target size={18} />
                    </button>
                  </div>
                </div>

                {/* Map Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Select from Map</span>
                    <span className="text-red-600 font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                  </label>
                  <LocationPicker 
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })} 
                    initialLocation={[location.lat, location.lng]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-3.5 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-red-600 text-white px-12 py-3.5 rounded-2xl text-sm font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {initialData ? 'Update Record' : 'Save Crime Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

