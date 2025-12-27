import { useForumsStore } from '../store/forumsStore'

/**
 * Collection of hooks for forum-related actions
 */

export const useCreatePost = () => {
  const { createPost, loading, error } = useForumsStore()
  return { createPost, loading, error }
}

export const useCreateComment = () => {
  const { createComment, loading, error } = useForumsStore()
  return { createComment, loading, error }
}

export const useCreateReply = () => {
  const { createReply, loading, error } = useForumsStore()
  return { createReply, loading, error }
}

export const useEditComment = () => {
  const { updateComment, loading, error } = useForumsStore()
  return { editComment: updateComment, loading, error }
}

export const useDeleteComment = () => {
  const { deleteComment, loading, error } = useForumsStore()
  return { deleteComment, loading, error }
}

export const useReportComment = () => {
  const { reportComment, loading, error } = useForumsStore()
  return { reportComment, loading, error }
}

export const useHeartComment = () => {
  const { heartComment, loading, error } = useForumsStore()
  return { heartComment, loading, error }
}

export const useFollowForum = () => {
  const { followForum, unfollowForum, loading, error } = useForumsStore()
  return { followForum, unfollowForum, loading, error }
}

