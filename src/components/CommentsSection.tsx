
import React from 'react';
import CommentsList from './CommentsList';
import AddComment from './AddComment';

interface CommentsSectionProps {
  refreshTrigger?: number;
  onCommentAdded?: () => void;
}

const CommentsSection = ({ refreshTrigger = 0, onCommentAdded }: CommentsSectionProps) => {
  const handleCommentAdded = () => {
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  return (
    <div className="space-y-6">
      <AddComment onCommentAdded={handleCommentAdded} />
      <CommentsList refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default CommentsSection;
