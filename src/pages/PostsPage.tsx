import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { BluePostList } from "../components/posts/BluePostList";
import { SearchBar } from "../components/filters/SearchBar";
import { useBluePostsQuery } from "../hooks/useBluePostsQuery";
import type { BluePostFilters, BluePost } from "../types/api";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";

export function PostsPage() {
  const [filters, setFilters] = useState<BluePostFilters>({
    page: 1,
    pageSize: 20,
    sortBy: "publishedAt",
    sortDirection: "desc"
  });

  const { data, isLoading, error } = useBluePostsQuery(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      page: 1 // Reset to first page when searching
    }));
  };

  const handlePostClick = (post: BluePost) => {
    // In a real app, this would navigate to a detailed view
    window.open(post.url, "_blank");
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Error loading posts</div>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blue Posts</h1>
            <p className="text-gray-600 mt-1">
              Latest official communications from game developers
            </p>
          </div>
          <button className="btn-secondary flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} className="max-w-2xl" />

        {/* Results Summary */}
        {data && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {((data.pageNumber - 1) * data.pageSize) + 1} to{" "}
              {Math.min(data.pageNumber * data.pageSize, data.totalCount)} of{" "}
              {data.totalCount} posts
            </div>
            <div>
              Page {data.pageNumber} of {data.totalPages}
            </div>
          </div>
        )}

        {/* Posts List */}
        <BluePostList
          posts={data?.items || []}
          isLoading={isLoading}
          onPostClick={handlePostClick}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-6">
            <button
              onClick={() => handlePageChange(data.pageNumber - 1)}
              disabled={!data.hasPreviousPage}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {data.pageNumber} of {data.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(data.pageNumber + 1)}
              disabled={!data.hasNextPage}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
