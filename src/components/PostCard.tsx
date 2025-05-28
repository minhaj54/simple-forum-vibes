
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Share, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CommentsSection from './CommentsSection';

interface Post {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
}

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch likes count and user's like status
  const { data: likesData } = useQuery({
    queryKey: ['likes', post.id],
    queryFn: async () => {
      const { data: likes, error } = await supabase
        .from('likes')
        .select('id, user_id')
        .eq('post_id', post.id);

      if (error) throw error;

      const likesCount = likes?.length || 0;
      const userHasLiked = user ? likes?.some(like => like.user_id === user.id) : false;

      return { likesCount, userHasLiked };
    },
  });

  // Fetch comments count
  const { data: commentsCount } = useQuery({
    queryKey: ['comments-count', post.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (error) throw error;
      return count || 0;
    },
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      if (likesData?.userHasLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', post.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
      console.error('Like error:', error);
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts.",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment on posts.",
        variant: "destructive",
      });
      return;
    }
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/?post=${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content || '',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Post link has been copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the post.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {post.content && (
          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
        )}
        {post.image_url && (
          <div className="mt-3 mb-4">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center space-x-1 ${
              likesData?.userHasLiked 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart 
              className={`h-4 w-4 ${likesData?.userHasLiked ? 'fill-current' : ''}`} 
            />
            <span>{likesData?.likesCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
          >
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <CommentsSection postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
