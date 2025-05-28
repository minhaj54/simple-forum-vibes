
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentsSectionProps {
  postId: string;
}

const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      setNewComment('');
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
      console.error('Comment error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate(newComment);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px]"
          />
          <Button 
            type="submit" 
            disabled={!newComment.trim() || addCommentMutation.isPending}
            size="sm"
          >
            {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
