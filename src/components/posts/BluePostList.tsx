import type { BluePost } from "../../types/api";
import { BluePostCard } from "./BluePostCard";
import { Loader2 } from "lucide-react";

interface BluePostListProps {
  posts: BluePost[];
  isLoading?: boolean;
  onPostClick?: (post: BluePost) => void;
}

export function BluePostList({ posts, isLoading, onPostClick }: BluePostListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading posts...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No posts found</div>
        <p className="text-gray-600">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <BluePostCard
          key={post.id}
          post={post}
          onClick={() => onPostClick?.(post)}
        />
      ))}
    </div>
  );
}
