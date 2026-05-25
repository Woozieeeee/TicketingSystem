"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";
import { formatTicketNumber } from "../../../lib/ticketFormatter";
import { 
  Search, 
  Filter, 
  Star, 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Award,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface Review {
  id: number;
  ticket_id: string;
  ticket_number?: number;
  reviewer: string;
  reviewer_role: string;
  assigned_to: string;
  department: string;
  rating: number;
  comment: string | null;
  created_at: string;
  ticket_title: string;
  ticket_category: string;
  ticket_status: string;
  ticket_global_id: string;
}

interface Analytics {
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
  five_star_reviews: number;
  four_star_reviews: number;
  three_star_reviews: number;
  two_star_reviews: number;
  one_star_reviews: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    
    // Role-based access control - only Heads/Admins can access
    if (parsedUser.role !== "Head" && parsedUser.role !== "Admin") {
      router.push("/dashboard");
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  // Load reviews and analytics
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (ratingFilter) params.append("rating", ratingFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (assignedToFilter) params.append("assigned_to", assignedToFilter);

      // Fetch reviews
      const reviewsRes = await fetch(`${API_URL}/api/reviews/all?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }

      // Fetch analytics
      const analyticsRes = await fetch(`${API_URL}/api/reviews/analytics`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, searchQuery, ratingFilter, departmentFilter, assignedToFilter]);

  // Get unique departments and assigned staff for filters
  const departments = Array.from(new Set(reviews.map(r => r.department)));
  const assignedStaff = Array.from(new Set(reviews.map(r => r.assigned_to)));

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-700">
          {rating}/5
        </span>
      </div>
    );
  };

  // Get rating color class
  const getRatingColorClass = (rating: number) => {
    if (rating >= 4) return "text-emerald-600 bg-emerald-50";
    if (rating === 3) return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full border-slate-200 animate-spin border-t-indigo-500" />
          <p className="text-sm font-medium text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const deptAccent =
    user?.dept === "Nursing"
      ? {
          color: "#e11d48",
          bgTw: "bg-rose-50",
          colorTw: "text-rose-500",
          textTw: "text-rose-800",
          borderTw: "border-rose-200",
        }
      : {
          color: "#16a34a",
          bgTw: "bg-green-50",
          colorTw: "text-green-500",
          textTw: "text-green-800",
          borderTw: "border-green-200",
        };

  return (
    <div className="min-h-screen bg-slate-50">
      <main
        className="transition-all duration-300 ease-in-out bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen font-sans"
        style={{
          marginLeft:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? "var(--sidebar-width, 256px)"
              : "0px",
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Reviews Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor customer satisfaction and IT staff performance
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${deptAccent.bgTw} ${deptAccent.colorTw} flex items-center justify-center`}>
                  <Star size={20} className={deptAccent.colorTw} />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.average_rating.toFixed(1)}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Average Rating
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Users size={20} className="text-indigo-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.total_reviews}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Reviews
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <ThumbsUp size={20} className="text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.positive_reviews}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Positive (4-5★)
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <ThumbsDown size={20} className="text-rose-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.negative_reviews}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Negative (1-2★)
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by comment, reviewer, or ticket title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* IT Staff Filter */}
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">All IT Staff</option>
              {assignedStaff.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || ratingFilter || departmentFilter || assignedToFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRatingFilter("");
                  setDepartmentFilter("");
                  setAssignedToFilter("");
                }}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 rounded-full border-slate-200 animate-spin border-t-indigo-500" />
                <p className="text-sm font-medium text-slate-500">Loading reviews...</p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <Star size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No reviews found
              </h3>
              <p className="text-sm text-slate-500">
                {searchQuery || ratingFilter || departmentFilter || assignedToFilter
                  ? "Try adjusting your filters"
                  : "Reviews will appear here once users submit them"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      IT Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/tickets?filter=${review.ticket_global_id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {review.ticket_number ? formatTicketNumber(review.ticket_number) : `#${review.ticket_global_id}`}
                          </span>
                          <span className="text-xs text-slate-500">
                            {review.ticket_title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {review.reviewer}
                          </span>
                          <span className="text-xs text-slate-500">
                            {review.reviewer_role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">
                          {review.assigned_to}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {review.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {review.comment || "No comment provided"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {formatDate(review.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            review.ticket_status === "Finished"
                              ? "bg-emerald-100 text-emerald-800"
                              : review.ticket_status === "Resolved"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {review.ticket_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rating Distribution (Optional) */}
        {analytics && (
          <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
              Rating Distribution
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  rating === 5
                    ? analytics.five_star_reviews
                    : rating === 4
                    ? analytics.four_star_reviews
                    : rating === 3
                    ? analytics.three_star_reviews
                    : rating === 2
                    ? analytics.two_star_reviews
                    : analytics.one_star_reviews;
                const percentage =
                  analytics.total_reviews > 0
                    ? (count / analytics.total_reviews) * 100
                    : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {rating}
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
