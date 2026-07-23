import { useEffect, useState } from 'react';
import { Bed, Bath, Maximize, MapPin, Calendar, Building, Car, Waves, Trees, Sofa, CheckCircle2, Play, Eye, Heart, GitCompare, Star, Phone, Mail, Calculator, ChevronLeft, ChevronRight, X, ArrowLeft, Share2, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice, formatArea, timeAgo } from '@/lib/utils';
import { sanitizeText, detectSqlInjection, RateLimiter } from '@/lib/security';
import PropertyCard from '@/components/PropertyCard';
import type { Property, Review, Profile } from '@/types';

const bookingRateLimiter = new RateLimiter(5000);

interface Props {
  propertyId: string;
}

export default function PropertyDetailsPage({ propertyId }: Props) {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare } = useFavorites();
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState(0);
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    Promise.all([
      supabase.from('properties').select('*, agent:profiles(*), images:property_images(*)').eq('id', propertyId).maybeSingle(),
      supabase.from('reviews').select('*, user:profiles(*)').eq('property_id', propertyId).eq('approved', true),
    ]).then(async ([propRes, revRes]) => {
      const prop = propRes.data as Property | null;
      if (prop) {
        setProperty(prop);
        setAgent(prop.agent ?? null);
        setLoanAmount(prop.price * 0.8);
        // Increment views
        await supabase.from('properties').update({ views: prop.views + 1 }).eq('id', prop.id);
        // Fetch similar
        const { data: sim } = await supabase
          .from('properties')
          .select('*, agent:profiles(*), images:property_images(*)')
          .eq('property_type', prop.property_type)
          .eq('approved', true)
          .neq('id', prop.id)
          .limit(3);
        setSimilar((sim ?? []) as Property[]);
      }
      setReviews((revRes.data ?? []) as Review[]);
      setLoading(false);
    });
  }, [propertyId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;
    setBookingError(null);

    if (detectSqlInjection(bookingNotes)) {
      setBookingError('Invalid characters detected in notes.');
      return;
    }
    if (!bookingRateLimiter.canProceed(user.id)) {
      setBookingError('Please wait a few seconds before booking again.');
      return;
    }

    const cleanNotes = sanitizeText(bookingNotes, 1000);
    const { error } = await supabase.from('appointments').insert({
      property_id: property.id,
      user_id: user.id,
      agent_id: property.agent_id,
      date: bookingDate,
      time: bookingTime,
      notes: cleanNotes,
      status: 'scheduled',
    });
    if (error) {
      setBookingError('Failed to book. Please try again.');
      return;
    }
    setBookingSuccess(true);
    setBookingDate('');
    setBookingTime('');
    setBookingNotes('');
    setTimeout(() => { setBookingSuccess(false); setShowBooking(false); }, 2500);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;
    setReviewError(null);

    if (detectSqlInjection(newReview.content)) {
      setReviewError('Invalid characters detected in review.');
      return;
    }
    if (newReview.content.trim().length < 10) {
      setReviewError('Review must be at least 10 characters long.');
      return;
    }
    if (!bookingRateLimiter.canProceed(`review-${user.id}`)) {
      setReviewError('Please wait a few seconds before submitting another review.');
      return;
    }

    const cleanContent = sanitizeText(newReview.content, 2000);
    const { error } = await supabase.from('reviews').insert({
      property_id: property.id,
      user_id: user.id,
      rating: newReview.rating,
      content: cleanContent,
      approved: false,
    });
    if (error) {
      setReviewError('Failed to submit review. Please try again.');
      return;
    }
    setReviewSuccess(true);
    setNewReview({ rating: 5, content: '' });
    setTimeout(() => { setReviewSuccess(false); setShowReviewForm(false); }, 2500);
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="aspect-[16/9] rounded-2xl skeleton mb-6" />
          <div className="h-10 w-2/3 rounded-xl skeleton mb-4" />
          <div className="h-6 w-1/2 rounded-xl skeleton mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-2xl skeleton" />
            <div className="h-96 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 mb-2">Property not found</p>
          <button onClick={() => navigate({ name: 'search' })} className="text-primary-600 font-medium">Browse properties</button>
        </div>
      </div>
    );
  }

  const images = property.images ?? [];
  const fav = isFavorite(property.id);
  const comparing = isInCompare(property.id);

  const monthlyPayment = (() => {
    const principal = loanAmount * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  })();

  const features = [
    { label: 'Furnished', value: property.furnished, icon: Sofa },
    { label: 'Parking', value: property.parking, icon: Car },
    { label: 'Swimming Pool', value: property.swimming_pool, icon: Waves },
    { label: 'Garden', value: property.garden, icon: Trees },
    { label: 'Balcony', value: property.balcony, icon: Building },
    { label: 'Ready to Move', value: property.ready_to_move, icon: CheckCircle2 },
  ].filter((f) => f.value);

  const allSpecs = [
    { label: 'Bedrooms', value: property.bedrooms, icon: Bed, show: property.bedrooms > 0 },
    { label: 'Bathrooms', value: property.bathrooms, icon: Bath, show: property.bathrooms > 0 },
    { label: 'Area', value: formatArea(property.area), icon: Maximize, show: true },
    { label: 'Floor', value: property.floor, icon: Building, show: property.floor > 0 },
    { label: 'Year Built', value: property.year_built ?? 'N/A', icon: Calendar, show: true },
    { label: 'Type', value: property.property_type, icon: Building, show: true },
  ].filter((s) => s.show);

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => navigate({ name: 'search' })} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6 rounded-2xl overflow-hidden">
          <div className="lg:col-span-2 lg:row-span-2 relative group cursor-pointer" onClick={() => setShowGallery(true)}>
            <img src={images[0]?.image_url ?? ''} alt="" className="w-full h-64 lg:h-[500px] object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={img.id} className="relative group cursor-pointer hidden lg:block" onClick={() => { setActiveImage(i + 1); setShowGallery(true); }}>
              <img src={img.image_url} alt="" className="w-full h-[246px] object-cover" />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                  +{images.length - 5} more
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${property.listing_status === 'For Sale' ? 'bg-primary-100 text-primary-700' : 'bg-accent-100 text-accent-700'}`}>
            {property.listing_status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{property.property_type}</span>
          {property.featured && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Featured</span>}
          {property.has_virtual_tour && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1"><Eye className="w-3 h-3" /> 360° Tour</span>}
          {property.has_video && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 flex items-center gap-1"><Play className="w-3 h-3" /> Video Tour</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{property.title}</h1>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { if (!user) { navigate({ name: 'auth' }); return; } toggleFavorite(property.id); }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${fav ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleCompare(property.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${comparing ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <GitCompare className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-500 flex items-center gap-1.5 mb-4">
                <MapPin className="w-4 h-4" /> {property.address}, {property.neighborhood}, {property.city}
              </p>
              <p className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
                {formatPrice(property.price, property.listing_status, property.currency)}
              </p>
              <p className="text-sm text-slate-500">Listed {timeAgo(property.created_at)} · {property.views} views</p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white rounded-2xl p-5 border border-slate-100">
              {allSpecs.map((spec) => (
                <div key={spec.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <spec.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{spec.label}</p>
                    <p className="font-semibold text-slate-900 text-sm">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h2 className="font-bold text-lg text-slate-900 mb-3">Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h2 className="font-bold text-lg text-slate-900 mb-4">Features & Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-sm text-slate-700">
                      <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                        <f.icon className="w-4 h-4 text-accent-600" />
                      </div>
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video / Virtual Tour */}
            {(property.has_video || property.has_virtual_tour) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h2 className="font-bold text-lg text-slate-900 mb-4">Virtual Tour & Video</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.has_virtual_tour && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center group cursor-pointer">
                      <Eye className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                      <p className="absolute bottom-3 left-3 text-white font-medium text-sm">360° Virtual Tour</p>
                    </div>
                  )}
                  {property.has_video && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center group cursor-pointer">
                      <Play className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                      <p className="absolute bottom-3 left-3 text-white font-medium text-sm">Video Tour</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {property.lat && property.lng && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h2 className="font-bold text-lg text-slate-900 mb-4">Location</h2>
                <div className="relative rounded-xl overflow-hidden h-80 bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50">
                  <svg className="w-full h-full opacity-40" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                    <line x1="0" y1="150" x2="800" y2="150" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="0" y1="280" x2="800" y2="280" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="300" y1="0" x2="300" y2="400" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="550" y1="0" x2="550" y2="400" stroke="#cbd5e1" strokeWidth="3" />
                    <path d="M 600 280 Q 700 320 800 360 L 800 400 L 600 400 Z" fill="#bfdbfe" opacity="0.5" />
                    <rect x="320" y="160" width="100" height="60" rx="8" fill="#bbf7d0" opacity="0.5" />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                    <div className="w-8 h-8 rounded-full bg-primary-600 border-4 border-white shadow-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Nearby Places</p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> Schools (0.5mi)</p>
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Hospitals (1.2mi)</p>
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" /> Restaurants (0.3mi)</p>
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-500" /> Transit (0.4mi)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-900">Reviews ({reviews.length})</h2>
                {user && (
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-sm text-primary-600 font-medium hover:text-primary-700">
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleReview} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-3 animate-fade-in">
                  {reviewSuccess && <p className="text-sm text-accent-600 font-medium">Review submitted! It will appear after admin approval.</p>}
                  {reviewError && <p className="text-sm text-red-600 font-medium">{reviewError}</p>}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setNewReview({ ...newReview, rating: n })}>
                          <Star className={`w-6 h-6 ${n <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Share your experience..."
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none"
                  />
                  <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors">
                    Submit Review
                  </button>
                </form>
              )}

              {reviews.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        {rev.user?.avatar_url ? (
                          <img src={rev.user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                            {rev.user?.full_name?.charAt(0) ?? 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{rev.user?.full_name ?? 'Anonymous'}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, j) => (
                              <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{rev.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Agent card */}
            {agent && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-4">Listed By</h3>
                <div className="flex items-center gap-3 mb-4">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                      {agent.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {agent.full_name}
                      {agent.verified && <CheckCircle2 className="w-4 h-4 text-primary-500" />}
                    </p>
                    <p className="text-xs text-slate-500">{agent.agency}</p>
                    <p className="text-xs text-slate-500">{agent.specialization}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600">
                      <Phone className="w-4 h-4" /> {agent.phone}
                    </a>
                  )}
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600">
                    <Mail className="w-4 h-4" /> {agent.email}
                  </a>
                </div>
                <button
                  onClick={() => { if (!user) { navigate({ name: 'auth' }); return; } setShowBooking(true); }}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors mb-2"
                >
                  Schedule a Visit
                </button>
                <button
                  onClick={() => { if (!user) { navigate({ name: 'auth' }); return; } setShowBooking(true); }}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Send Inquiry
                </button>
              </div>
            )}

            {/* Mortgage Calculator */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-600" /> Mortgage Calculator
              </h3>
              <p className="text-xs text-slate-500 mb-4">Estimate your monthly payment</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Home Price</label>
                  <input type="number" value={property.price} readOnly className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Down Payment: {downPayment}%</label>
                  <input type="range" min="0" max="50" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Interest Rate: {interestRate}%</label>
                  <input type="range" min="1" max="15" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Loan Term: {loanTerm} years</label>
                  <input type="range" min="5" max="30" step="5" value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))} className="w-full accent-primary-600" />
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Estimated Monthly Payment</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(monthlyPayment)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Loan Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loanAmount * (1 - downPayment / 100))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setShowGallery(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img src={images[activeImage]?.image_url ?? ''} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => (prev + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <p className="text-center text-white/70 text-sm mt-3">{activeImage + 1} / {images.length}</p>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBooking(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Schedule a Visit</h3>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {bookingSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-14 h-14 text-accent-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-900 mb-1">Booking Confirmed!</p>
                <p className="text-sm text-slate-500">We'll send you a confirmation shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {bookingError && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{bookingError}</div>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <select required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                    <option value="">Select a time</option>
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} rows={2} placeholder="Any questions or requests..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                  Confirm Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
