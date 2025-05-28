
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <div className="mt-3">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
