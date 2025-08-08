import { useQuery } from "@tanstack/react-query";
import { bluePostsApi } from "../services/bluePostsApi";
import type { BluePostFilters } from "../types/api";

export const useBluePostsQuery = (filters: BluePostFilters = {}) => {
  return useQuery({
    queryKey: ["bluePosts", filters],
    queryFn: () => bluePostsApi.getPosts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useBluePostQuery = (id: number) => {
  return useQuery({
    queryKey: ["bluePost", id],
    queryFn: () => bluePostsApi.getPost(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRecentPostsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ["recentPosts", limit],
    queryFn: () => bluePostsApi.getRecentPosts(limit),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
