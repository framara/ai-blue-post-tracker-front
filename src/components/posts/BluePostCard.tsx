import type { BluePost } from "../../types/api";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, User, MapPin, Hash } from "lucide-react";

interface BluePostCardProps {
  post: BluePost;
  onClick?: () => void;
}

export function BluePostCard({ post, onClick }: BluePostCardProps) {
  const publishedDate = new Date(post.publishedAt);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });

  return (
    <article 
      className="post-card p-6 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
            {post.title}
          </h3>
          
          {/* Meta information */}
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span className="font-medium">{post.author.name}</span>
              {post.author.role && (
                <span className="ml-1 text-blue-600">({post.author.role})</span>
              )}
            </div>
            
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{post.region.name}</span>
            </div>
            
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-1" />
              <span>{post.forumCategory.name}</span>
            </div>
          </div>
        </div>

        {/* External link */}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      {/* Content preview */}
      <div className="mb-4">
        <p className="text-gray-700 line-clamp-3">
          {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}...
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.tagId}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag.tag.name}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{post.source.name}</span>
          <span>{post.postType.name}</span>
        </div>
        <time dateTime={post.publishedAt}>
          {timeAgo}
        </time>
      </div>
    </article>
  );
}
